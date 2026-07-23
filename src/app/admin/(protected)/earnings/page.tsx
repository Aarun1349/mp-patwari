import { requirePagePermission, actorTenantId, PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { computeTenantEarnings } from "@/lib/billing/earnings";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function EarningsPage() {
  const session = await requirePagePermission(PERMISSIONS.REVENUE_READ_OWN);
  const tenantId = actorTenantId(session);

  const [earnings, orders] = await Promise.all([
    computeTenantEarnings(tenantId),
    prisma.order.findMany({
      where: { tenantId, status: "paid" },
      include: { package: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
      take: 100,
    }),
  ]);

  const shareBps = earnings.revenueShareBps;

  return (
    <div className="auth-card auth-card-wide">
      <h1>Earnings</h1>
      <p className="page-subtitle">
        Your share of paid sales. Earnings accrue on the ex-GST value; TDS (if any) is applied when a
        payout statement is issued.
      </p>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-label">Paid sales</div>
          <div className="stat-value">{earnings.paidOrders}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Gross (ex-GST)</div>
          <div className="stat-value">{rupees(earnings.grossPaise)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Platform fee</div>
          <div className="stat-value">{rupees(earnings.commissionPaise)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Your net</div>
          <div className="stat-value">{rupees(earnings.netPaise)}</div>
          <div className="stat-sub">{(shareBps / 100).toFixed(0)}% share</div>
        </div>
      </div>

      <table className="report-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Package</th>
            <th>Gross (ex-GST)</th>
            <th>Your share</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">No paid sales yet.</td>
            </tr>
          )}
          {orders.map((o) => {
            const gross = o.taxableValuePaise ?? o.amountPaise;
            const share = Math.round((gross * shareBps) / 10000);
            return (
              <tr key={o.id}>
                <td>{o.paidAt?.toLocaleDateString("en-IN") ?? "—"}</td>
                <td>{o.package.name}</td>
                <td>{rupees(gross)}</td>
                <td>{rupees(share)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
