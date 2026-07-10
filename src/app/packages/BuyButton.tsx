"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createOrderAction, confirmPaymentAction } from "@/app/actions/orders";

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    handler: (response: RazorpaySuccessResponse) => void;
  }): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function BuyButton({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [pending, startTransition] = useTransition();

  function handleBuy() {
    setError(null);
    startTransition(async () => {
      const result = await createOrderAction(packageId, couponCode);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      if ("freeOrderCredited" in result) {
        router.push("/purchases");
        return;
      }

      if (!window.Razorpay) {
        setError("Payment library did not load. Please refresh and try again.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: "INR",
        order_id: result.orderId,
        name: "ExamsExpress",
        description: result.packageName,
        handler: (response) => {
          // Fast path for immediate UX feedback — the webhook (server-side,
          // guaranteed delivery) is the authoritative source of truth, same
          // heartbeat-vs-reaper split used for exam-attempt finalization.
          confirmPaymentAction({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }).finally(() => {
            router.push("/purchases");
          });
        },
      });
      razorpay.open();
    });
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <input
        type="text"
        placeholder="Coupon code (optional)"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        style={{ width: "140px", marginRight: "6px", fontSize: "12px", padding: "4px" }}
      />
      {error && <p className="auth-error">{error}</p>}
      <button type="button" onClick={handleBuy} disabled={pending || !scriptReady}>
        {pending ? "Starting…" : "Buy"}
      </button>
    </>
  );
}
