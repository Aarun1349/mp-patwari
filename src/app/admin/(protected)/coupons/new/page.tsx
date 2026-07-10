"use client";

import { useActionState } from "react";
import { createCouponAction } from "@/app/actions/adminCoupons";

export default function NewCouponPage() {
  const [state, action, pending] = useActionState(createCouponAction, undefined);

  return (
    <div className="auth-card" style={{ maxWidth: "480px" }}>
      <h1>Create Coupon</h1>
      <form action={action} className="auth-form">
        <label htmlFor="code">Code</label>
        <input id="code" name="code" type="text" placeholder="LAUNCH20" required />

        <label htmlFor="discountType">Discount type</label>
        <select id="discountType" name="discountType" defaultValue="percent">
          <option value="percent">Percent off</option>
          <option value="flat">Flat amount off (paise)</option>
        </select>

        <label htmlFor="discountValue">Discount value</label>
        <input id="discountValue" name="discountValue" type="number" required />

        <label htmlFor="maxRedemptions">Max redemptions (blank = unlimited)</label>
        <input id="maxRedemptions" name="maxRedemptions" type="number" />

        <label htmlFor="validFrom">Valid from (optional)</label>
        <input id="validFrom" name="validFrom" type="date" />

        <label htmlFor="validUntil">Valid until (optional)</label>
        <input id="validUntil" name="validUntil" type="date" />

        <label>
          <input type="checkbox" name="isActive" defaultChecked /> Active
        </label>

        {state?.error && <p className="auth-error">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create coupon"}
        </button>
      </form>
    </div>
  );
}
