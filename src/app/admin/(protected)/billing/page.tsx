import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getTaxConfig } from "@/lib/billing/tax";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function BillingPage() {
  await requirePagePermission(PERMISSIONS.ORDER_READ);
  const cfg = getTaxConfig();

  const [agg, byTenant] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "paid" },
      _sum: { amountPaise: true, taxableValuePaise: true, taxPaise: true },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["tenantId"],
      where: { status: "paid" },
      _sum: { amountPaise: true, taxPaise: true },
      _count: { _all: true },
    }),
  ]);

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: byTenant.map((t) => t.tenantId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(tenants.map((t) => [t.id, t.name]));

  const rows = byTenant
    .map((t) => ({
      name: t.tenantId === PLATFORM_TENANT_ID ? "ExamsExpress (platform)" : nameById.get(t.tenantId) ?? t.tenantId,
      orders: t._count._all,
      gross: t._sum.amountPaise ?? 0,
      gst: t._sum.taxPaise ?? 0,
    }))
    .sort((a, b) => b.gross - a.gross);

  return (
    <div className="auth-card auth-card-wide">
      <h1>GST &amp; Billing</h1>
      <p className="page-subtitle">
        Collected across all paid orders.{" "}
        <span className={`status-badge ${cfg.gstRateBps > 0 ? "status-good" : "status-neutral"}`}>
          GST {cfg.gstRateBps > 0 ? `ON · ${(cfg.gstRateBps / 100).toFixed(0)}%` : "OFF"}
        </span>
      </p>

      {cfg.gstRateBps === 0 && (
        <p className="muted" style={{ marginTop: "-8px" }}>
          GST is not being collected yet. Set <code>GST_RATE_BPS</code> / <code>PLATFORM_GSTIN</code> /{" "}
          <code>GST_SAC_CODE</code> (after CA sign-off) to enable it — figures below will populate automatically.
        </p>
      )}

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-label">Paid orders</div>
          <div className="stat-value">{agg._count._all}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Gross collected</div>
          <div className="stat-value">{rupees(agg._sum.amountPaise ?? 0)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Taxable value</div>
          <div className="stat-value">{rupees(agg._sum.taxableValuePaise ?? 0)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">GST collected (payable)</div>
          <div className="stat-value">{rupees(agg._sum.taxPaise ?? 0)}</div>
        </div>
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Revenue by tenant</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Paid orders</th>
            <th>Gross</th>
            <th>GST</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">No paid orders yet.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.orders}</td>
              <td>{rupees(r.gross)}</td>
              <td>{rupees(r.gst)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
