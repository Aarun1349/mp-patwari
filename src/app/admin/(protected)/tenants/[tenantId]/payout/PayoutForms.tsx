"use client";

import { useActionState } from "react";
import {
  saveTenantKycAction,
  recordPayoutAction,
  type PayoutActionState,
} from "@/app/actions/adminPayouts";

interface KycValues {
  payeeLegalName: string | null;
  panNumber: string | null;
  payoutGstin: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  upiId: string | null;
}

export function KycForm({ tenantId, values }: { tenantId: string; values: KycValues }) {
  const [state, action, pending] = useActionState<PayoutActionState, FormData>(saveTenantKycAction, undefined);
  return (
    <form action={action} className="ee-form-grid">
      <input type="hidden" name="tenantId" value={tenantId} />
      <label className="ee-field">
        <span>Payee legal name (as per PAN)</span>
        <input className="ee-input" name="payeeLegalName" defaultValue={values.payeeLegalName ?? ""} />
      </label>
      <label className="ee-field">
        <span>PAN</span>
        <input className="ee-input" name="panNumber" defaultValue={values.panNumber ?? ""} placeholder="ABCDE1234F" />
      </label>
      <label className="ee-field">
        <span>GSTIN (optional)</span>
        <input className="ee-input" name="payoutGstin" defaultValue={values.payoutGstin ?? ""} />
      </label>
      <label className="ee-field">
        <span>Bank account name</span>
        <input className="ee-input" name="bankAccountName" defaultValue={values.bankAccountName ?? ""} />
      </label>
      <label className="ee-field">
        <span>Bank account number</span>
        <input className="ee-input" name="bankAccountNumber" defaultValue={values.bankAccountNumber ?? ""} />
      </label>
      <label className="ee-field">
        <span>IFSC</span>
        <input className="ee-input" name="bankIfsc" defaultValue={values.bankIfsc ?? ""} placeholder="HDFC0001234" />
      </label>
      <label className="ee-field ee-span-2">
        <span>UPI ID (alternative to bank)</span>
        <input className="ee-input" name="upiId" defaultValue={values.upiId ?? ""} placeholder="name@upi" />
      </label>
      {state?.error && <p className="ee-span-2 delete-error">{state.error}</p>}
      {state?.ok && <p className="ee-span-2" style={{ color: "var(--color-success)", fontSize: 13 }}>{state.ok}</p>}
      <div className="ee-span-2">
        <button type="submit" className="ee-btn ee-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save KYC details"}
        </button>
      </div>
    </form>
  );
}

export function RecordPayoutForm({ tenantId, canPay }: { tenantId: string; canPay: boolean }) {
  const [state, action, pending] = useActionState<PayoutActionState, FormData>(recordPayoutAction, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="tenantId" value={tenantId} />
      {state?.error && <p className="delete-error">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--color-success)", fontSize: 13 }}>{state.ok}</p>}
      <button type="submit" className="ee-btn ee-btn--primary" disabled={pending || !canPay}>
        {pending ? "Recording…" : "Record payout (since last)"}
      </button>
      {!canPay && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Complete KYC + agreement to enable.</p>}
    </form>
  );
}
