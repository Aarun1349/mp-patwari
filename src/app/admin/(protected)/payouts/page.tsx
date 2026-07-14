import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Influencer / partner payout report. Commission is earned only on PAID orders
 * that used a code carrying a commission — percent = % of amount actually paid,
 * flat = a fixed amount per paid redemption. Attribution comes from
 * Order.couponId, which is already recorded at checkout.
 */
export default async function AdminPayoutsPage() {
  await verifyAdminSession();
  const coupons = await prisma.coupon.findMany({
    where: { commissionType: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const couponIds = coupons.map((c) => c.id);
  const grouped = couponIds.length
    ? await prisma.order.groupBy({
        by: ["couponId"],
        where: { status: "paid", couponId: { in: couponIds } },
        _count: { _all: true },
        _sum: { amountPaise: true },
      })
    : [];

  const statsByCoupon = new Map(
    grouped.map((g) => [g.couponId, { redemptions: g._count._all, gross: g._sum.amountPaise ?? 0 }])
  );

  const rows = coupons.map((c) => {
    const stats = statsByCoupon.get(c.id) ?? { redemptions: 0, gross: 0 };
    const owed =
      c.commissionType === "percent"
        ? Math.round((stats.gross * c.commissionValue) / 100)
        : c.commissionValue * stats.redemptions;
    return {
      id: c.id,
      code: c.code,
      owner: c.ownerName ?? "—",
      rate: c.commissionType === "percent" ? `${c.commissionValue}%` : `${rupees(c.commissionValue)}/sale`,
      redemptions: stats.redemptions,
      gross: stats.gross,
      owed,
      active: c.isActive,
    };
  });

  const totalRedemptions = rows.reduce((s, r) => s + r.redemptions, 0);
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalOwed = rows.reduce((s, r) => s + r.owed, 0);

  return (
    <div className="auth-card auth-card-wide">
      <h1>Influencer Payouts</h1>
      <p className="muted">
        Commission owed on paid orders per attributed code.{"  ·  "}
        <Link href="/admin/coupons">← Back to coupons</Link>
      </p>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-label">Attributed Sales</div>
          <div className="stat-value">{totalRedemptions}</div>
          <div className="stat-sub">paid orders via commission codes</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Revenue Attributed</div>
          <div className="stat-value">{rupees(totalGross)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Total Commission Owed</div>
          <div className="stat-value">{rupees(totalOwed)}</div>
          <div className="stat-sub">across all partners</div>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="muted">
          No commission codes yet. Create a coupon with a commission to track influencer payouts.
        </p>
      )}

      {rows.length > 0 && (
        <table className="report-table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Code</th>
              <th>Rate</th>
              <th>Paid redemptions</th>
              <th>Revenue</th>
              <th>Commission owed</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.owner}</td>
                <td className="mono">{r.code}</td>
                <td>{r.rate}</td>
                <td>{r.redemptions}</td>
                <td>{rupees(r.gross)}</td>
                <td>
                  <strong>{rupees(r.owed)}</strong>
                </td>
                <td>{r.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td>
                <strong>{totalRedemptions}</strong>
              </td>
              <td>
                <strong>{rupees(totalGross)}</strong>
              </td>
              <td>
                <strong>{rupees(totalOwed)}</strong>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
