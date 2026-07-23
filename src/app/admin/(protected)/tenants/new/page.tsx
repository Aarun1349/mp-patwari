"use client";

import { useActionState } from "react";
import { createTenantAction } from "@/app/actions/adminTenants";

export default function NewTenantPage() {
  const [state, action, pending] = useActionState(createTenantAction, undefined);

  return (
    <div className="auth-card" style={{ maxWidth: "560px" }}>
      <h1>Onboard a teacher</h1>
      <p className="page-subtitle">
        Creates their storefront page and (optionally) their login. Share the storefront link and the
        login with the teacher — they upload their own mocks and set packages.
      </p>

      <form action={action} className="auth-form">
        <label htmlFor="name">Teacher / brand name</label>
        <input id="name" name="name" type="text" placeholder="Ravi Sir – Maths" required />

        <label htmlFor="slug">Storefront slug (their page URL)</label>
        <input id="slug" name="slug" type="text" placeholder="ravi-sir" required />
        <small className="muted">Their page will be examsexpress.in/t/&lt;slug&gt;</small>

        <label htmlFor="ownerName">Owner name (optional)</label>
        <input id="ownerName" name="ownerName" type="text" placeholder="Ravi Kumar" />

        <label htmlFor="tagline">Tagline (optional)</label>
        <input id="tagline" name="tagline" type="text" placeholder="MP TET Maths, made simple." />

        <label htmlFor="bio">Short bio (optional)</label>
        <textarea id="bio" name="bio" rows={2} placeholder="10+ years coaching MP TET Maths aspirants." />

        <label htmlFor="revenueSharePct">Teacher revenue share (%)</label>
        <input id="revenueSharePct" name="revenueSharePct" type="number" min={0} max={100} defaultValue={70} required />
        <small className="muted">The teacher keeps this % of each ex-GST sale; the platform keeps the rest.</small>

        <div style={{ borderTop: "1px solid #e5e1d8", margin: "14px 0 6px", paddingTop: "12px" }}>
          <strong style={{ fontSize: "14px" }}>Teacher login (optional — can add later)</strong>
        </div>

        <label htmlFor="loginEmail">Login email</label>
        <input id="loginEmail" name="loginEmail" type="email" placeholder="ravi@example.com" />

        <label htmlFor="loginPassword">Temporary password (10+ chars)</label>
        <input id="loginPassword" name="loginPassword" type="text" placeholder="give the teacher this to change later" />
        <small className="muted">
          Shown as plain text so you can copy it to the teacher. They sign in at /admin/login.
        </small>

        {state?.error && <p className="auth-error">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create teacher"}
        </button>
      </form>
    </div>
  );
}
