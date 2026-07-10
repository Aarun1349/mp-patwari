"use server";

import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, verifyPaymentSignature, RazorpayApiError } from "@/lib/payments/razorpay";
import { creditOrderForPayment, creditFreeOrder } from "@/lib/payments/creditOrder";
import { validateAndPriceCoupon, InvalidCouponError } from "@/lib/payments/coupon";

export type CreateOrderResult =
  | { orderId: string; amount: number; keyId: string; packageName: string }
  | { freeOrderCredited: true }
  | { error: string };

export async function createOrderAction(packageId: string, couponCode?: string): Promise<CreateOrderResult> {
  const { userId } = await verifySession();

  const { allowed } = await checkRateLimit(`order:create:${userId}`, {
    windowSeconds: 3600,
    max: 10,
  });
  if (!allowed) {
    return { error: "Too many attempts. Please wait a while and try again." };
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    return { error: "This package is not currently available." };
  }

  if (pkg.kind === "topup") {
    const credit = await prisma.userCredit.findUnique({ where: { userId } });
    if (!credit || credit.testsTotalPurchased <= 0) {
      return { error: "Top-up packages are only available to existing customers." };
    }
  }

  let couponId: string | undefined;
  let discountPaise = 0;
  let finalAmountPaise = pkg.pricePaise;
  if (couponCode?.trim()) {
    try {
      const priced = await validateAndPriceCoupon(couponCode, pkg);
      couponId = priced.coupon.id;
      discountPaise = priced.discountPaise;
      finalAmountPaise = priced.finalAmountPaise;
    } catch (err) {
      if (err instanceof InvalidCouponError) return { error: err.message };
      throw err;
    }
  }

  const order = await prisma.order.create({
    data: {
      userId,
      packageId: pkg.id,
      amountPaise: finalAmountPaise,
      discountPaise,
      couponId,
      status: "created",
    },
  });

  // A coupon can discount a package to ₹0 — Razorpay doesn't support ₹0
  // orders, so credit it directly instead of opening the checkout modal.
  if (finalAmountPaise <= 0) {
    await creditFreeOrder(order.id);
    return { freeOrderCredited: true };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return { error: "Payments are not configured yet. Please try again later." };
  }

  try {
    const razorpayOrder = await createRazorpayOrder(finalAmountPaise, order.id, {
      userId,
      packageId: pkg.id,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      orderId: razorpayOrder.id,
      amount: finalAmountPaise,
      keyId,
      packageName: pkg.name,
    };
  } catch (err) {
    if (err instanceof RazorpayApiError) {
      console.error("createOrderAction: Razorpay order creation failed", err);
      return { error: "Could not start payment. Please try again." };
    }
    throw err;
  }
}

export type ConfirmPaymentResult = { credited: boolean } | { error: string };

export async function confirmPaymentAction(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ConfirmPaymentResult> {
  const { userId } = await verifySession();

  const validSignature = verifyPaymentSignature(
    params.razorpayOrderId,
    params.razorpayPaymentId,
    params.razorpaySignature
  );
  if (!validSignature) {
    return { error: "Payment verification failed." };
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId: params.razorpayOrderId } });
  if (!order || order.userId !== userId) {
    return { error: "Order not found." };
  }

  const result = await creditOrderForPayment(params.razorpayOrderId, params.razorpayPaymentId);
  return { credited: result.credited };
}
