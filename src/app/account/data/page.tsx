import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { DeleteAccount } from "./DeleteAccount";

export const dynamic = "force-dynamic";

export default async function DataPrivacyPage() {
  const { user } = await verifySession();

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Your data & privacy</h1>
        <p className="page-subtitle">Access or delete the personal data we hold about you (DPDP Act, 2023).</p>

        <h2 style={{ marginTop: 8 }}>Download your data</h2>
        <p className="muted">
          Get a machine-readable copy of everything we hold on you — profile, orders, test credits and attempts.
        </p>
        <a href="/api/privacy/export" className="ee-btn" download style={{ display: "inline-flex", marginTop: 8 }}>
          Download my data (JSON)
        </a>

        <h2 style={{ marginTop: 32 }}>Delete your account</h2>
        <DeleteAccount />
      </div>
    </AppShell>
  );
}
