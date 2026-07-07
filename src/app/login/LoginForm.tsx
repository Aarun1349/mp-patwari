"use client";

import { useActionState, useState } from "react";
import { requestOtpAction, verifyOtpAction, type AuthActionState } from "@/app/actions/auth";

export function LoginForm() {
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");

  const [sendState, sendAction, sendPending] = useActionState(
    async (prevState: AuthActionState, formData: FormData) => {
      const result = await requestOtpAction(prevState, formData);
      if (result?.success) setPhase("otp");
      return result;
    },
    undefined
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpAction, undefined);

  if (phase === "phone") {
    return (
      <form action={sendAction} className="auth-form">
        <label htmlFor="phone">Mobile number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          maxLength={10}
        />
        {sendState?.error && <p className="auth-error">{sendState.error}</p>}
        <button type="submit" disabled={sendPending}>
          {sendPending ? "Sending…" : "Send OTP"}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="auth-form">
      <input type="hidden" name="phone" value={phone} />
      <label htmlFor="code">Enter the OTP sent to {phone}</label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        placeholder="6-digit code"
        required
        maxLength={6}
      />
      {verifyState?.error && <p className="auth-error">{verifyState.error}</p>}
      <button type="submit" disabled={verifyPending}>
        {verifyPending ? "Verifying…" : "Verify & Login"}
      </button>
      <button type="button" className="auth-secondary" onClick={() => setPhase("phone")}>
        Change number
      </button>
    </form>
  );
}
