import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleCouponActiveAction } from "@/app/actions/adminCoupons";

function formatCommission(c: { commissionType: string | null; commissionValue: number }): string {
  if (!c.commissionType) return "—";
  return c.commissionType === "percent" ? `${c.commissionValue}%` : `₹${(c.commissionValue / 100).toFixed(2)}`;
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Coupons</h1>
      <p className="muted">
        <Link href="/admin/coupons/new">+ Create new coupon</Link>
        {"  ·  "}
        <Link href="/admin/payouts">View influencer payouts →</Link>
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Owner</th>
            <th>Discount</th>
            <th>Commission</th>
            <th>Redemptions</th>
            <th>Valid window</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td className="mono">{c.code}</td>
              <td>{c.ownerName ?? "—"}</td>
              <td>{c.discountType === "percent" ? `${c.discountValue}%` : `₹${(c.discountValue / 100).toFixed(2)}`}</td>
              <td>{formatCommission(c)}</td>
              <td>
                {c.redemptionCount}
                {c.maxRedemptions ? `/${c.maxRedemptions}` : " (unlimited)"}
              </td>
              <td>
                {c.validFrom ? c.validFrom.toLocaleDateString() : "—"} –{" "}
                {c.validUntil ? c.validUntil.toLocaleDateString() : "—"}
              </td>
              <td>{c.isActive ? "Yes" : "No"}</td>
              <td>
                <form action={toggleCouponActiveAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className={`btn-sm ${c.isActive ? "btn-danger" : "btn-secondary"}`}>
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
