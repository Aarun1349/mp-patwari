import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { previewPayout } from "@/lib/billing/payout";
import { LEGAL } from "@/lib/legal";
import { TeacherAgreement } from "@/components/legal/TeacherAgreement";
import { setKycVerifiedAction, acceptAgreementAction } from "@/app/actions/adminPayouts";
import { KycForm, RecordPayoutForm } from "./PayoutForms";

export const dynamic = "force-dynamic";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function TenantPayoutPage({ params }: { params: Promise<{ tenantId: string }> }) {
  await requirePagePermission(PERMISSIONS.PAYOUT_READ);
  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) notFound();

  const [p, statements] = await Promise.all([
    previewPayout(tenantId),
    prisma.payoutStatement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const agreementCurrent = tenant.agreementVersion === LEGAL.payout.agreementVersion;

  return (
    <div className="auth-card auth-card-wide">
      <h1>Payout — {tenant.name}</h1>
      <p className="muted">
        Revenue share {(tenant.revenueShareBps / 100).toFixed(0)}% · <Link href="/admin/tenants">← Back to teachers</Link>
      </p>

      {/* Readiness */}
      {p.canPay ? (
        <div className="ee-alert ee-alert--info" style={{ marginTop: 8 }}>
          ✓ Payout-ready — KYC verified and current agreement accepted.
        </div>
      ) : (
        <div className="ee-alert ee-alert--warning" style={{ marginTop: 8 }}>
          Not payout-ready: {p.missing.join(" · ")}
        </div>
      )}

      {/* Earnings preview */}
      <div className="stat-tile-row" style={{ marginTop: 16 }}>
        <div className="stat-tile"><div className="stat-label">Gross (ex-GST)</div><div className="stat-value">{rupees(p.grossPaise)}</div></div>
        <div className="stat-tile"><div className="stat-label">Platform commission</div><div className="stat-value">{rupees(p.commissionPaise)}</div></div>
        <div className="stat-tile"><div className="stat-label">Teacher net</div><div className="stat-value">{rupees(p.netPaise)}</div></div>
        <div className="stat-tile"><div className="stat-label">TDS ({p.tdsRatePercent}% · {p.tdsSection})</div><div className="stat-value">− {rupees(p.tdsPaise)}</div></div>
        <div className="stat-tile"><div className="stat-label">Payable now</div><div className="stat-value">{rupees(p.payablePaise)}</div></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <RecordPayoutForm tenantId={tenantId} canPay={p.canPay} />
      </div>

      {/* Agreement */}
      <h2 style={{ marginTop: 32 }}>Teacher agreement</h2>
      <p className="muted">
        {agreementCurrent ? (
          <>✓ Accepted v{tenant.agreementVersion} on {tenant.agreementAcceptedAt?.toLocaleDateString("en-IN")}.</>
        ) : (
          <>Current version v{LEGAL.payout.agreementVersion} not yet accepted.</>
        )}
      </p>
      <details style={{ margin: "8px 0 12px" }}>
        <summary style={{ cursor: "pointer", color: "var(--color-primary)" }}>View agreement text</summary>
        <div style={{ marginTop: 12 }}>
          <TeacherAgreement teacherName={tenant.name} revenueSharePct={Math.round(tenant.revenueShareBps / 100)} />
        </div>
      </details>
      {!agreementCurrent && (
        <form action={acceptAgreementAction}>
          <input type="hidden" name="tenantId" value={tenantId} />
          <button type="submit" className="ee-btn ee-btn--secondary">Record acceptance of v{LEGAL.payout.agreementVersion}</button>
        </form>
      )}

      {/* KYC */}
      <h2 style={{ marginTop: 32 }}>KYC & bank details</h2>
      <p className="muted">
        {tenant.kycVerified ? (
          <>✓ Verified on {tenant.kycVerifiedAt?.toLocaleDateString("en-IN")}.</>
        ) : (
          <>Not verified. Enter details, then mark verified to enable payouts.</>
        )}
      </p>
      <KycForm
        tenantId={tenantId}
        values={{
          payeeLegalName: tenant.payeeLegalName,
          panNumber: tenant.panNumber,
          payoutGstin: tenant.payoutGstin,
          bankAccountName: tenant.bankAccountName,
          bankAccountNumber: tenant.bankAccountNumber,
          bankIfsc: tenant.bankIfsc,
          upiId: tenant.upiId,
        }}
      />
      <form action={setKycVerifiedAction} style={{ marginTop: 12 }}>
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="verify" value={tenant.kycVerified ? "0" : "1"} />
        <button type="submit" className={`ee-btn ${tenant.kycVerified ? "ee-btn--secondary" : "ee-btn--primary"}`}>
          {tenant.kycVerified ? "Un-verify KYC" : "Mark KYC verified"}
        </button>
      </form>

      {/* History */}
      <h2 style={{ marginTop: 32 }}>Payout history</h2>
      {statements.length === 0 ? (
        <p className="muted">No payouts recorded yet.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr><th>Period</th><th>Gross</th><th>Commission</th><th>Net</th><th>TDS</th><th>Status</th></tr>
          </thead>
          <tbody>
            {statements.map((s) => (
              <tr key={s.id}>
                <td>{s.periodStart.toLocaleDateString("en-IN")} – {s.periodEnd.toLocaleDateString("en-IN")}</td>
                <td>{rupees(s.grossPaise)}</td>
                <td>{rupees(s.commissionPaise)}</td>
                <td>{rupees(s.netPaise)}</td>
                <td>{rupees(s.tdsPaise)}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
