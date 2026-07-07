import "server-only";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email/sendReceipt";

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

    await tx.userCredit.upsert({
      where: { userId: order.userId },
      create: {
        userId: order.userId,
        testsRemaining: order.package.testCount,
        testsTotalPurchased: order.package.testCount,
      },
      update: {
        testsRemaining: { increment: order.package.testCount },
        testsTotalPurchased: { increment: order.package.testCount },
      },
    });

    return {
      credited: true,
      orderId: order.id,
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

  return { credited: result.credited, orderId: result.orderId, status: result.status };
}
