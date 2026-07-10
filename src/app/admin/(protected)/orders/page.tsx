import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const [orders, revenueAgg, statusCounts] = await Promise.all([
    prisma.order.findMany({
      include: { user: { select: { phone: true, email: true } }, package: { select: { name: true } }, coupon: { select: { code: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.aggregate({ where: { status: "paid" }, _sum: { amountPaise: true, discountPaise: true }, _count: true }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const totalRevenue = (revenueAgg._sum.amountPaise ?? 0) / 100;
  const totalDiscounts = (revenueAgg._sum.discountPaise ?? 0) / 100;

  return (
    <div className="auth-card auth-card-wide">
      <h1>Orders &amp; Revenue</h1>

      <div className="dashboard-links-grid" style={{ marginBottom: "20px" }}>
        <div className="dashboard-highlight">
          <h2>Total Revenue</h2>
          <p>₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="dashboard-highlight">
          <h2>Paid Orders</h2>
          <p>{revenueAgg._count}</p>
        </div>
        <div className="dashboard-highlight">
          <h2>Total Discounts Given</h2>
          <p>₹{totalDiscounts.toFixed(2)}</p>
        </div>
        {statusCounts.map((s) => (
          <div className="dashboard-highlight" key={s.status}>
            <h2>{s.status}</h2>
            <p>{s._count}</p>
          </div>
        ))}
      </div>

      <h2>Recent Orders (latest 200)</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Package</th>
            <th>Amount</th>
            <th>Discount</th>
            <th>Coupon</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.user.phone ?? o.user.email ?? "—"}</td>
              <td>{o.package.name}</td>
              <td>₹{(o.amountPaise / 100).toFixed(2)}</td>
              <td>{o.discountPaise > 0 ? `₹${(o.discountPaise / 100).toFixed(2)}` : "—"}</td>
              <td>{o.coupon?.code ?? "—"}</td>
              <td>{o.status}</td>
              <td>{o.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
