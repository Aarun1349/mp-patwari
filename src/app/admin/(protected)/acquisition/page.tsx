import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const DIRECT = "(direct / untagged)";

/**
 * Acquisition report — signups, paying users and revenue grouped by first-touch
 * source (utm_source captured at signup: QR/pamphlet, Meta, YouTube, an
 * influencer's link, etc.). Complements /admin/payouts, which tracks per-code
 * commissions; this shows channel performance overall.
 */
export default async function AdminAcquisitionPage() {
  await verifyAdminSession();
  const [signupGroups, paidOrders] = await Promise.all([
    prisma.user.groupBy({ by: ["signupSource"], _count: { _all: true } }),
    prisma.order.findMany({
      where: { status: "paid" },
      select: { amountPaise: true, userId: true, user: { select: { signupSource: true } } },
    }),
  ]);

  type Row = { source: string; signups: number; payers: Set<string>; revenue: number };
  const bySource = new Map<string, Row>();
  const row = (src: string | null): Row => {
    const key = src ?? DIRECT;
    let r = bySource.get(key);
    if (!r) {
      r = { source: key, signups: 0, payers: new Set(), revenue: 0 };
      bySource.set(key, r);
    }
    return r;
  };

  for (const g of signupGroups) row(g.signupSource).signups += g._count._all;
  for (const o of paidOrders) {
    const r = row(o.user.signupSource);
    r.revenue += o.amountPaise;
    r.payers.add(o.userId);
  }

  const rows = [...bySource.values()]
    .map((r) => ({
      source: r.source,
      signups: r.signups,
      payers: r.payers.size,
      revenue: r.revenue,
      conv: r.signups > 0 ? (r.payers.size / r.signups) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.signups - a.signups);

  const totals = rows.reduce(
    (t, r) => ({ signups: t.signups + r.signups, payers: t.payers + r.payers, revenue: t.revenue + r.revenue }),
    { signups: 0, payers: 0, revenue: 0 }
  );

  return (
    <div className="auth-card auth-card-wide">
      <h1>Acquisition</h1>
      <p className="muted">
        Signups and revenue by first-touch source (from <span className="mono">?utm_source=</span> on QR / pamphlet /
        ad links).{"  ·  "}
        <Link href="/admin/payouts">Influencer payouts →</Link>
      </p>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-label">Total Signups</div>
          <div className="stat-value">{totals.signups}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Paying Users</div>
          <div className="stat-value">{totals.payers}</div>
          <div className="stat-sub">
            {totals.signups > 0 ? ((totals.payers / totals.signups) * 100).toFixed(1) : "0"}% overall conversion
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">{rupees(totals.revenue)}</div>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Signups</th>
            <th>Paying users</th>
            <th>Conversion</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source}>
              <td>{r.source}</td>
              <td>{r.signups}</td>
              <td>{r.payers}</td>
              <td>{r.conv.toFixed(1)}%</td>
              <td>{rupees(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>
              <strong>{totals.signups}</strong>
            </td>
            <td>
              <strong>{totals.payers}</strong>
            </td>
            <td></td>
            <td>
              <strong>{rupees(totals.revenue)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
