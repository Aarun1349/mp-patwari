import "server-only";
import { createHmac } from "node:crypto";
import { timingSafeEqualStrings } from "@/lib/auth/crypto";

export class RazorpayApiError extends Error {}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/** Plain fetch to Razorpay's Orders API — no vendor SDK, matches this codebase's MSG91 pattern. */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>
): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new RazorpayApiError("Razorpay is not configured.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new RazorpayApiError(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Verifies a webhook delivery's signature. Razorpay signs the RAW request body
 * (before any JSON parsing) with HMAC-SHA256 using the webhook secret,
 * delivered in the X-Razorpay-Signature header.
 * https://razorpay.com/docs/webhooks/validate-test/
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualStrings(expected, signatureHeader);
}

/**
 * Verifies the client-side checkout success callback's signature:
 * HMAC-SHA256("<order_id>|<payment_id>", key_secret).
 * NOTE: this formula is consistent across Razorpay's docs/SDKs but was not
 * directly quotable from a fetched page during implementation — re-verify
 * against a real test-mode payment before relying on it for a live launch.
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const expected = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return timingSafeEqualStrings(expected, razorpaySignature);
}
