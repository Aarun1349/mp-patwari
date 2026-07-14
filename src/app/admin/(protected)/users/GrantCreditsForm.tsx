"use client";

import { useActionState } from "react";
import { grantCreditsAction } from "@/app/actions/adminUsers";

export function GrantCreditsForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(grantCreditsAction, undefined);

  return (
    <form action={action} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <input type="hidden" name="userId" value={userId} />
      <input
        type="number"
        name="testCount"
        min={1}
        max={100}
        defaultValue={5}
        style={{ width: "60px", padding: "4px" }}
      />
      <button type="submit" className="btn-sm" disabled={pending}>
        {pending ? "Granting…" : "Grant"}
      </button>
      {state?.error && <span style={{ color: "#a3242a", fontSize: "11px" }}>{state.error}</span>}
      {state?.success && <span style={{ color: "#2a7a2a", fontSize: "11px" }}>Granted</span>}
    </form>
  );
}
