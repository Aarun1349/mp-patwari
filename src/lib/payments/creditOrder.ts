import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email/sendReceipt";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";
import { writeAudit } from "@/lib/audit";

/**
 * Grant a package's credits into the per-STAGE pools, inside the crediting
 * transaction. testCount → PRELIMS/default-stage pool; mainsCount → MAINS pool.
 * A combo package sets both. Skips a pool whose grant is 0. Same idempotency as
 * before — this runs only after the order's status flip succeeds.
 */
async function applyPackageCredit(
  tx: Prisma.TransactionClient,
  order: { userId: string; tenantId: string; package: { examId: string; testCount: number; mainsCount: number } }
) {
  const grants = [
    { stage: "PRELIMS", count: order.package.testCount },
    { stage: "MAINS", count: order.package.mainsCount },
  ];
  for (const g of grants) {
    if (g.count <= 0) continue;
    await tx.userCredit.upsert({
      where: {
        userId_examId_stage_tenantId: {
          userId: order.userId, examId: order.package.examId, stage: g.stage, tenantId: order.tenantId,
        },
      },
      create: {
        userId: order.userId, examId: order.package.examId, stage: g.stage, tenantId: order.tenantId,
        testsRemaining: g.count, testsTotalPurchased: g.count,
      },
      update: { testsRemaining: { increment: g.count }, testsTotalPurchased: { increment: g.count } },
    });
  }
}

export interface CreditResult {
  credited: boolean;
  orderId: string;
  status: string;
}

/**
 * The single choke point for crediting a paid order, called from both the
 * webhook route and the client-side confirm action — never duplicated.
 *
 * Unlike finalizeAttempt() (Phase 1), which splits "flip status" from "do the
 * work" so a lost race never double-scores, this wraps the status flip AND
 * the credit increment in one transaction: if the increment failed after a
 * bare flip, a customer would have paid with nothing to show for it, which is
 * worse than the double-credit risk finalizeAttempt() avoids. If the
 * transaction fails, status stays "created" and Razorpay's own retry (or a
 * manual dashboard re-delivery) will cleanly retry the whole thing later.
 *
 * Race-safe against: webhook-before-confirm, confirm-before-webhook, a true
 * duplicate webhook delivery (deduped by Order.status itself — correct for
 * Razorpay's at-least-once delivery guarantee), and concurrent firing
 * (serialized by Postgres row-level locking on the Order row, same mechanism
 * already proven in entitlement.ts's credit decrement).
 */
export async function creditOrderForPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<CreditResult> {
  const result = await prisma.$transaction(async (tx) => {
    const flip = await tx.order.updateMany({
      where: { razorpayOrderId, status: "created" },
      data: { status: "paid", razorpayPaymentId, paidAt: new Date() },
    });

    if (flip.count === 0) {
      const existing = await tx.order.findUnique({ where: { razorpayOrderId } });
      return { credited: false, orderId: existing?.id ?? "", status: existing?.status ?? "unknown" };
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { razorpayOrderId },
      include: { package: true, user: true },
    });

    await applyPackageCredit(tx, order);

    // Buying a teacher's package auto-enrolls the student with that teacher.
    if (order.tenantId !== PLATFORM_TENANT_ID) {
      await tx.enrollment.upsert({
        where: { userId_tenantId: { userId: order.userId, tenantId: order.tenantId } },
        create: { userId: order.userId, tenantId: order.tenantId },
        update: {},
      });
    }

    // Assign a gap-free sequential invoice number at payment time (merchant of
    // record). The counter increment is atomic within this transaction.
    const inv = await tx.sequenceCounter.upsert({
      where: { key: "invoice" },
      create: { key: "invoice", value: 1 },
      update: { value: { increment: 1 } },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        invoiceNo: `EE-${new Date().getFullYear()}-${String(inv.value).padStart(6, "0")}`,
        invoiceDate: new Date(),
      },
    });

    if (order.couponId) {
      // Atomic, race-safe cap: increment only while under maxRedemptions, so
      // concurrent redemptions can never push the count past the limit (Prisma
      // can't compare two columns in a typed update, hence raw SQL).
      await tx.$executeRaw`
        UPDATE coupons SET "redemptionCount" = "redemptionCount" + 1
        WHERE id = ${order.couponId}
          AND ("maxRedemptions" IS NULL OR "redemptionCount" < "maxRedemptions")
      `;
    }

    return {
      credited: true,
      orderId: order.id,
      userId: order.userId,
      status: "paid",
      receipt: {
        to: order.user.email,
        userName: order.user.name,
        packageName: order.package.name,
        testCount: order.package.testCount,
        amountPaise: order.amountPaise,
      },
    };
  });

  const receipt = "receipt" in result ? result.receipt : undefined;

  if (result.credited && receipt?.to) {
    try {
      await sendReceiptEmail({
        to: receipt.to,
        userName: receipt.userName,
        packageName: receipt.packageName,
        testCount: receipt.testCount,
        amountPaise: receipt.amountPaise,
        orderId: result.orderId,
      });
    } catch (err) {
      console.error("sendReceiptEmail failed (payment already credited)", err);
    }
  } else if (result.credited) {
    console.log(`Order ${result.orderId} credited — no email on file, skipping receipt.`);
  }

  if (result.credited && "userId" in result) {
    await writeAudit({
      actorType: "student",
      actorId: result.userId,
      action: "purchase",
      resourceType: "Order",
      resourceId: result.orderId,
      metadata: receipt ? { package: receipt.packageName, amountPaise: receipt.amountPaise } : null,
    });
  }
  return { credited: result.credited, orderId: result.orderId, status: result.status };
}

/**
 * Same crediting logic as creditOrderForPayment(), but for a coupon that
 * discounts a package to ₹0 — there's no Razorpay payment to confirm, so this
 * is keyed by Order.id directly and called synchronously from
 * createOrderAction() instead of from the webhook/client-confirm paths.
 */
export async function creditFreeOrder(orderId: string): Promise<CreditResult> {
  const result = await prisma.$transaction(async (tx) => {
    const flip = await tx.order.updateMany({
      where: { id: orderId, status: "created" },
      data: { status: "paid", paidAt: new Date() },
    });

    if (flip.count === 0) {
      const existing = await tx.order.findUnique({ where: { id: orderId } });
      return { credited: false, orderId, status: existing?.status ?? "unknown" };
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { package: true, user: true },
    });

    await applyPackageCredit(tx, order);

    // Buying a teacher's package auto-enrolls the student with that teacher.
    if (order.tenantId !== PLATFORM_TENANT_ID) {
      await tx.enrollment.upsert({
        where: { userId_tenantId: { userId: order.userId, tenantId: order.tenantId } },
        create: { userId: order.userId, tenantId: order.tenantId },
        update: {},
      });
    }

    // Assign a gap-free sequential invoice number at payment time (merchant of
    // record). The counter increment is atomic within this transaction.
    const inv = await tx.sequenceCounter.upsert({
      where: { key: "invoice" },
      create: { key: "invoice", value: 1 },
      update: { value: { increment: 1 } },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        invoiceNo: `EE-${new Date().getFullYear()}-${String(inv.value).padStart(6, "0")}`,
        invoiceDate: new Date(),
      },
    });

    if (order.couponId) {
      // Atomic, race-safe cap: increment only while under maxRedemptions, so
      // concurrent redemptions can never push the count past the limit (Prisma
      // can't compare two columns in a typed update, hence raw SQL).
      await tx.$executeRaw`
        UPDATE coupons SET "redemptionCount" = "redemptionCount" + 1
        WHERE id = ${order.couponId}
          AND ("maxRedemptions" IS NULL OR "redemptionCount" < "maxRedemptions")
      `;
    }

    return {
      credited: true,
      orderId: order.id,
      userId: order.userId,
      status: "paid",
      receipt: {
        to: order.user.email,
        userName: order.user.name,
        packageName: order.package.name,
        testCount: order.package.testCount,
        amountPaise: order.amountPaise,
      },
    };
  });

  const receipt = "receipt" in result ? result.receipt : undefined;

  if (result.credited && receipt?.to) {
    try {
      await sendReceiptEmail({
        to: receipt.to,
        userName: receipt.userName,
        packageName: receipt.packageName,
        testCount: receipt.testCount,
        amountPaise: receipt.amountPaise,
        orderId: result.orderId,
      });
    } catch (err) {
      console.error("sendReceiptEmail failed (payment already credited)", err);
    }
  }

  if (result.credited && "userId" in result) {
    await writeAudit({
      actorType: "student",
      actorId: result.userId,
      action: "purchase",
      resourceType: "Order",
      resourceId: result.orderId,
      metadata: receipt ? { package: receipt.packageName, amountPaise: receipt.amountPaise } : null,
    });
  }
  return { credited: result.credited, orderId: result.orderId, status: result.status };
}
