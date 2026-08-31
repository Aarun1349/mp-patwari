"use client";

import { useActionState } from "react";
import { eraseAccountAction, type EraseState } from "@/app/actions/privacy";

export function DeleteAccount() {
  const [state, formAction, pending] = useActionState<EraseState, FormData>(eraseAccountAction, undefined);

  return (
    <form action={formAction} className="delete-account">
      <p className="muted">
        This permanently anonymises your account and personal details and logs you out everywhere. Your past orders and
        invoices are kept as required by law, but no longer linked to your identity. This cannot be undone.
      </p>
      <label className="delete-label" htmlFor="confirm">
        Type <strong>DELETE</strong> to confirm
      </label>
      <input id="confirm" name="confirm" className="ee-input" autoComplete="off" placeholder="DELETE" />
      {state?.error && <p className="delete-error">{state.error}</p>}
      <button type="submit" className="ee-btn ee-btn--danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
