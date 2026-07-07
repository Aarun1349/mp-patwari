import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { creditOrderForPayment } from "@/lib/payments/creditOrder";
import { prisma } from "@/lib/prisma";

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  status: string;
}

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
  };
}

// No getApiSession() here — the caller is Razorpay's servers, not a logged-in
// user. The HMAC signature check below is the authentication.
export async function POST(req: Request) {
  // Must read the raw body BEFORE any JSON parsing — signature verification
  // needs the exact bytes Razorpay signed.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const paymentEntity = event.payload.payment?.entity;

  if (event.event === "payment.captured" && paymentEntity) {
    await creditOrderForPayment(paymentEntity.order_id, paymentEntity.id);
  } else if (event.event === "payment.failed" && paymentEntity) {
    await prisma.order.updateMany({
      where: { razorpayOrderId: paymentEntity.order_id, status: "created" },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({ ok: true });
}
