"use client";

import { useActionState } from "react";
import type { PackageActionState } from "@/app/actions/adminPackages";

export function PackageForm({
  action,
  defaults,
}: {
  action: (state: PackageActionState, formData: FormData) => Promise<PackageActionState>;
  defaults?: {
    id?: string;
    name: string;
    testCount: number;
    pricePaise: number;
    kind: "standard" | "topup";
    validityDays: number;
    sortOrder: number;
    isActive: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="auth-form">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      <label htmlFor="name">Name</label>
      <input id="name" name="name" type="text" defaultValue={defaults?.name} required />

      <label htmlFor="testCount">Test count</label>
      <input id="testCount" name="testCount" type="number" defaultValue={defaults?.testCount ?? 5} required />

      <label htmlFor="pricePaise">Price (paise, e.g. 39900 = ₹399)</label>
      <input id="pricePaise" name="pricePaise" type="number" defaultValue={defaults?.pricePaise ?? 0} required />

      <label htmlFor="kind">Kind</label>
      <select id="kind" name="kind" defaultValue={defaults?.kind ?? "standard"}>
        <option value="standard">Standard</option>
        <option value="topup">Top-up (existing customers only)</option>
      </select>

      <label htmlFor="validityDays">Validity (days)</label>
      <input id="validityDays" name="validityDays" type="number" defaultValue={defaults?.validityDays ?? 60} required />

      <label htmlFor="sortOrder">Sort order</label>
      <input id="sortOrder" name="sortOrder" type="number" defaultValue={defaults?.sortOrder ?? 0} required />

      <label>
        <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} /> Active
      </label>

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : defaults?.id ? "Save changes" : "Create package"}
      </button>
    </form>
  );
}
