import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/adminSession";
import { computeTenantEarnings } from "@/lib/billing/earnings";
import { getCohortAnalytics } from "@/lib/exam/studentAnalytics";

function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function accuracyColor(pct: number): string {
  if (pct < 50) return "#c0392b";
  if (pct < 65) return "#b9770e";
  return "#1e7a3d";
}

/** The /admin home shown to tenant-scoped roles (partner/creator) instead of the
 * platform analytics dashboard — scoped entirely to their own tenant. */
export async function PartnerHome() {
  const session = await getAdminSession();
  const tenantId = session?.adminUser.tenantId ?? null;

  const [tenant, paperCount, packageCount, earnings, cohort] = await Promise.all([
    tenantId ? prisma.tenant.findUnique({ where: { id: tenantId } }) : Promise.resolve(null),
    tenantId ? prisma.paper.count({ where: { tenantId } }) : Promise.resolve(0),
    tenantId ? prisma.package.count({ where: { tenantId } }) : Promise.resolve(0),
    tenantId ? computeTenantEarnings(tenantId) : Promise.resolve(null),
    tenantId ? getCohortAnalytics(tenantId) : Promise.resolve(null),
  ]);

  return (
    <>
    <div className="auth-card auth-card-wide">
      <h1>{tenant?.name ?? "Your dashboard"}</h1>
      <p className="page-subtitle">
        Welcome{session?.adminUser.name ? `, ${session.adminUser.name}` : ""}. Manage your own mock
        tests and packages here — you only see and control your own content.
      </p>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-label">Your mock tests</div>
          <div className="stat-value">{paperCount}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Your packages</div>
          <div className="stat-value">{packageCount}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Paid sales</div>
          <div className="stat-value">{earnings?.paidOrders ?? 0}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Your earnings (net)</div>
          <div className="stat-value">{rupees(earnings?.netPaise ?? 0)}</div>
          {earnings && (
            <div className="stat-sub">
              {rupees(earnings.grossPaise)} gross · {(earnings.revenueShareBps / 100).toFixed(0)}% share
            </div>
          )}
        </div>
      </div>

      <div className="admin-toolbar" style={{ marginTop: "1.25rem", gap: "8px", flexWrap: "wrap" }}>
        <Link href="/admin/papers" className="btn">
          Papers &amp; Questions
        </Link>
        <Link href="/admin/upload" className="btn">
          Upload Questions
        </Link>
        <Link href="/admin/packages" className="btn">
          Packages
        </Link>
        {tenant?.slug && (
          <Link href={`/t/${tenant.slug}`} className="btn btn-secondary" target="_blank">
            View my public page ↗
          </Link>
        )}
      </div>
    </div>

    {cohort && cohort.attemptCount > 0 && (
      <div className="auth-card auth-card-wide" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <div>
            <h2>Class Insights</h2>
            <p className="page-subtitle">
              {cohort.studentCount} student(s) · {cohort.attemptCount} completed test(s) — where your class is weak, and who to pull aside.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
          <div>
            <h3 style={{ margin: "0 0 8px" }}>Weakest sections (class-wide)</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Class accuracy</th>
                  <th>Correct / Attempted</th>
                </tr>
              </thead>
              <tbody>
                {cohort.sections.map((r) => (
                  <tr key={r.code}>
                    <td>{r.nameEn}</td>
                    <td style={{ color: accuracyColor(r.accuracyPct), fontWeight: 600 }}>
                      {r.attempted > 0 ? `${r.accuracyPct}%` : "—"}
                    </td>
                    <td>
                      {r.correct} / {r.attempted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ margin: "0 0 8px" }}>Students to watch</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Accuracy</th>
                  <th>Tests</th>
                </tr>
              </thead>
              <tbody>
                {cohort.atRisk.map((s) => (
                  <tr key={s.userId}>
                    <td>{s.name}</td>
                    <td style={{ color: accuracyColor(s.accuracyPct), fontWeight: 600 }}>{s.accuracyPct}%</td>
                    <td>{s.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
