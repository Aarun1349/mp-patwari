"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/actions/adminAuth";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="username" />

      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required autoComplete="current-password" />

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
