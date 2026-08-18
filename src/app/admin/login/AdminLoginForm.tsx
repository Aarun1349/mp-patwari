"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/actions/adminAuth";
import { Input, Field } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="username" placeholder="you@examsexpress.in" />
      </Field>

      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
      </Field>

      {state?.error && <Alert variant="error">{state.error}</Alert>}

      <Button type="submit" variant="primary" size="lg" block loading={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
