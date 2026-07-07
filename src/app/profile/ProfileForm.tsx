"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="name">Name</label>
      <input id="name" name="name" type="text" defaultValue={name} required maxLength={100} />

      <label htmlFor="email">Email (optional)</label>
      <input id="email" name="email" type="email" defaultValue={email} />

      {state?.error && <p className="auth-error">{state.error}</p>}
      {state?.success && <p className="auth-success">Profile updated.</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
