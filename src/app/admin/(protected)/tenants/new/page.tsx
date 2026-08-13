"use client";

import { useActionState, useState } from "react";
import { createTenantAction } from "@/app/actions/adminTenants";

/** Strong, readable temp password using the browser CSPRNG. Ambiguous chars
 *  (0/O, 1/l/I) are excluded so it's easy to read out or type. */
function generateStrongPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** brand name → storefront slug, capped at the 50-char schema limit. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

export default function NewTenantPage() {
  const [state, action, pending] = useActionState(createTenantAction, undefined);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <div className="auth-card" style={{ maxWidth: "640px", margin: "0 auto" }}>
      <a href="/admin/tenants" style={{ fontSize: "13px", display: "inline-block", marginBottom: "10px" }}>
        ← Back to teachers
      </a>
      <h1>Onboard a teacher</h1>
      <p className="page-subtitle">
        Creates their storefront page and (optionally) their login. When you add a login email, we
        email the teacher their sign-in link and password automatically.
      </p>

      <form action={action} className="auth-form">
        <label htmlFor="name">Teacher / brand name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          placeholder="Ravi Sir – Maths"
          required
        />

        <label htmlFor="slug">Storefront slug (their page URL) — auto-filled from the name</label>
        <input
          id="slug"
          name="slug"
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").slice(0, 50));
          }}
          placeholder="ravi-sir"
          required
        />
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
        <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
          <input
            id="loginPassword"
            name="loginPassword"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="click Generate →"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={() => setPassword(generateStrongPassword())}
            style={{
              whiteSpace: "nowrap",
              padding: "0 16px",
              background: "#1A2A44",
              color: "#F0E9D8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🎲 Generate
          </button>
        </div>
        <small className="muted">
          Click Generate for a strong password. On create, we email it to the teacher with their
          sign-in link — it&apos;s also shown here so you have a copy.
        </small>

        {state?.error && <p className="auth-error">{state.error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create teacher"}
        </button>
      </form>
    </div>
  );
}
