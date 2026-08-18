"use client";

import { useActionState, useState } from "react";
import { createTenantAction } from "@/app/actions/adminTenants";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

/** Strong, readable temp password using the browser CSPRNG. */
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

const MAX_REVENUE_SHARE = 70;

export default function NewTenantPage() {
  const [state, action, pending] = useActionState(createTenantAction, undefined);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [revShare, setRevShare] = useState("70");

  return (
    <div className="auth-card" style={{ maxWidth: "920px", margin: "0 auto" }}>
      <a href="/admin/tenants" style={{ fontSize: "13px", display: "inline-block", marginBottom: "10px" }}>
        ← Back to teachers
      </a>
      <h1>Onboard a teacher</h1>
      <p className="page-subtitle">
        Creates their storefront page and (optionally) their login. When you add a login email, we email the
        teacher their sign-in link and password automatically.
      </p>

      <form action={action} className="ee-form-grid">
        <Field label="Teacher / brand name" htmlFor="name" className="ee-span-2">
          <Input
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
        </Field>

        <Field
          label="Storefront slug (page URL) — auto-filled from the name"
          htmlFor="slug"
          hint="Their storefront will be <slug>.examsexpress.in"
          className="ee-span-2"
        >
          <Input
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
        </Field>

        <Field label="Owner name (optional)" htmlFor="ownerName">
          <Input id="ownerName" name="ownerName" type="text" placeholder="Ravi Kumar" />
        </Field>

        <Field label="Tagline (optional)" htmlFor="tagline">
          <Input id="tagline" name="tagline" type="text" placeholder="MP TET Maths, made simple." />
        </Field>

        <Field label="Short bio (optional)" htmlFor="bio" className="ee-span-2">
          <Textarea id="bio" name="bio" rows={2} placeholder="10+ years coaching MP TET Maths aspirants." />
        </Field>

        <Field
          label="Teacher revenue share (%)"
          htmlFor="revenueSharePct"
          hint={`The teacher keeps this % of each ex-GST sale; the platform keeps the rest. Max ${MAX_REVENUE_SHARE}%.`}
        >
          <Input
            id="revenueSharePct"
            name="revenueSharePct"
            type="number"
            min={0}
            max={MAX_REVENUE_SHARE}
            value={revShare}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (e.target.value === "") setRevShare("");
              else setRevShare(String(Math.min(MAX_REVENUE_SHARE, Math.max(0, n))));
            }}
            required
          />
        </Field>

        <div className="ee-span-2" style={{ borderTop: "1px solid var(--color-border)", margin: "6px 0 0", paddingTop: "14px" }}>
          <strong style={{ fontSize: "14px", color: "var(--color-text)" }}>Teacher login (optional — can add later)</strong>
        </div>

        <Field label="Login email" htmlFor="loginEmail">
          <Input id="loginEmail" name="loginEmail" type="email" placeholder="ravi@example.com" />
        </Field>

        <Field
          label="Temporary password (10+ chars)"
          htmlFor="loginPassword"
          hint="On create we email it to the teacher with their sign-in link — also shown here so you have a copy."
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <Input
              id="loginPassword"
              name="loginPassword"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="click Generate →"
              style={{ flex: 1 }}
            />
            <Button type="button" variant="secondary" onClick={() => setPassword(generateStrongPassword())}>
              🎲 Generate
            </Button>
          </div>
        </Field>

        {state?.error && (
          <div className="ee-span-2">
            <Alert variant="error">{state.error}</Alert>
          </div>
        )}

        <div className="ee-span-2">
          <Button type="submit" variant="primary" size="lg" block loading={pending}>
            {pending ? "Creating…" : "Create teacher"}
          </Button>
        </div>
      </form>
    </div>
  );
}
