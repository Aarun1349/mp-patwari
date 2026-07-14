import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { BarChart, type Point } from "../DashCharts";
import { Pagination } from "../Pagination";
import "../admin-dash.css";

const PAGE_SIZE = 25;

function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}
function rupees2(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function rupeesShort(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}k`;
  return `₹${Math.round(r)}`;
}

const STATUS_BADGE: Record<string, string> = {
  paid: "status-good",
  failed: "status-bad",
  created: "status-pending",
};

const DAYS = 30;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await verifyAdminSession();
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const ordersWhere = query
    ? {
        user: {
          OR: [
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
          ],
        },
      }
    : undefined;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (DAYS - 1));

  const [orders, ordersTotal, revenueAgg, statusCounts, paidForTrend] = await Promise.all([
    prisma.order.findMany({
      where: ordersWhere,
      include: {
        user: { select: { phone: true, email: true, name: true } },
        package: { select: { name: true } },
        coupon: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where: ordersWhere }),
    prisma.order.aggregate({
      where: { status: "paid" },
      _sum: { amountPaise: true, discountPaise: true },
      _count: true,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      where: { status: "paid", paidAt: { gte: start } },
      select: { paidAt: true, amountPaise: true },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.amountPaise ?? 0;
  const totalDiscounts = revenueAgg._sum.discountPaise ?? 0;
  const paidCount = revenueAgg._count;
  const avgOrder = paidCount > 0 ? totalRevenue / paidCount : 0;

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  // Revenue trend (last 30 days).
  const byDay = new Map<string, number>();
  const dayKeys: { key: string; label: string }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayKeys.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}` });
    byDay.set(key, 0);
  }
  for (const o of paidForTrend) {
    if (!o.paidAt) continue;
    const key = o.paidAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, byDay.get(key)! + o.amountPaise);
  }
  const trend: Point[] = dayKeys.map((d) => ({ label: d.label, value: byDay.get(d.key)! }));

  return (
    <div className="auth-card auth-card-wide">
      <h1>Orders &amp; Revenue</h1>
      <p className="page-subtitle">Payments, discounts and order status across the platform.</p>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">{rupees(totalRevenue)}</div>
          <div className="kpi-sub">{paidCount} paid orders</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg Order Value</div>
          <div className="kpi-value">{rupees(avgOrder)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Discounts Given</div>
          <div className="kpi-value">{rupees(totalDiscounts)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Failed</div>
          <div className="kpi-value">{countByStatus.failed ?? 0}</div>
          <div className="kpi-sub">{countByStatus.created ?? 0} unpaid / created</div>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: "16px" }}>
        <h2>Revenue</h2>
        <p className="dash-card-sub">Paid orders per day · last {DAYS} days</p>
        <BarChart data={trend} color="#c9a227" format={rupeesShort} height={180} />
      </div>

      <h2 style={{ fontSize: "15px", color: "#1a2a44", margin: "6px 0 10px" }}>Recent orders</h2>
      <div className="admin-toolbar">
        <form method="get" className="admin-search">
          <input type="text" name="q" placeholder="Search by user (phone, email, name)" defaultValue={query} />
          <button type="submit">Search</button>
          {query && (
            <a className="btn btn-secondary" href="/admin/orders">
              Clear
            </a>
          )}
        </form>
        <span className="toolbar-note toolbar-spacer">
          {ordersTotal.toLocaleString("en-IN")} order(s){query ? " matching" : ""}
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
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
                <td>{o.user.name ?? o.user.phone ?? o.user.email ?? "—"}</td>
                <td>{o.package.name}</td>
                <td>{rupees2(o.amountPaise)}</td>
                <td>{o.discountPaise > 0 ? rupees2(o.discountPaise) : "—"}</td>
                <td className="mono">{o.coupon?.code ?? "—"}</td>
                <td>
                  <span className={`status-badge ${STATUS_BADGE[o.status] ?? "status-neutral"}`}>{o.status}</span>
                </td>
                <td>{o.createdAt.toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination basePath="/admin/orders" query={{ q: query || undefined }} page={page} pageSize={PAGE_SIZE} total={ordersTotal} />
    </div>
  );
}
