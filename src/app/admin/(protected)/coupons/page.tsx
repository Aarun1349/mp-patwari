import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleCouponActiveAction } from "@/app/actions/adminCoupons";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Coupons</h1>
      <p className="muted">
        <Link href="/admin/coupons/new">+ Create new coupon</Link>
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
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
              <td>{c.discountType === "percent" ? `${c.discountValue}%` : `₹${(c.discountValue / 100).toFixed(2)}`}</td>
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
                  <button type="submit" style={{ fontSize: "12px", padding: "2px 6px" }}>
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
