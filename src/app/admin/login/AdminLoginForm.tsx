"use client";

import { useActionState, useState } from "react";
import { adminLoginAction } from "@/app/actions/adminAuth";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="username" />

      <label htmlFor="password">Password</label>
      <div style={{ position: "relative" }}>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          style={{ paddingRight: "60px" }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#1a2a44",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 6px",
          }}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
