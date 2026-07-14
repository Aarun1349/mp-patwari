"use client";

import { useActionState } from "react";
import { createSectionAction } from "@/app/actions/adminExams";

export function AddSectionForm({ examId, nextSortOrder }: { examId: string; nextSortOrder: number }) {
  const [state, action, pending] = useActionState(createSectionAction, undefined);

  return (
    <form action={action} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end", marginTop: "12px" }}>
      <input type="hidden" name="examId" value={examId} />
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "11px", color: "#8a8372" }}>Code</label>
        <input name="code" placeholder="GK" required style={{ width: "110px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "11px", color: "#8a8372" }}>Name (English)</label>
        <input name="nameEn" placeholder="General Knowledge" required style={{ width: "200px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "11px", color: "#8a8372" }}>Name (Hindi)</label>
        <input name="nameHi" placeholder="सामान्य ज्ञान" required style={{ width: "200px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <label style={{ fontSize: "11px", color: "#8a8372" }}>Order</label>
        <input name="sortOrder" type="number" defaultValue={nextSortOrder} style={{ width: "70px" }} />
      </div>
      <button type="submit" className="btn-sm" disabled={pending}>
        {pending ? "Adding…" : "+ Add section"}
      </button>
      {state?.error && <p className="auth-error" style={{ width: "100%", margin: "4px 0 0" }}>{state.error}</p>}
    </form>
  );
}
