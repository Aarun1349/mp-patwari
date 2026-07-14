import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { BarChart, HBars, Donut, type Point, type Segment } from "./DashCharts";
import "./admin-dash.css";

function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}
function rupeesShort(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}k`;
  return `₹${Math.round(r)}`;
}
function dayLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const DAYS = 14;

const STATUS_COLOR: Record<string, string> = {
  submitted: "#1f7a3d",
  locked: "#b3261e",
  expired: "#c9a227",
  in_progress: "#8a8372",
  paused: "#8a8372",
};
const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  locked: "Locked",
  expired: "Expired",
  in_progress: "In progress",
  paused: "Paused",
};

export default async function AdminDashboardPage() {
  await verifyAdminSession();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (DAYS - 1));

  const [paidOrders, totalUsers, recentUsers, attemptGroups, totalAttempts] = await Promise.all([
    prisma.order.findMany({
      where: { status: "paid" },
      select: {
        amountPaise: true,
        paidAt: true,
        userId: true,
        package: { select: { name: true } },
        user: { select: { signupSource: true, phone: true, name: true } },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.user.count(),
    prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.attempt.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.attempt.count(),
  ]);

  // ---- KPIs ----
  const totalRevenue = paidOrders.reduce((s, o) => s + o.amountPaise, 0);
  const payingUsers = new Set(paidOrders.map((o) => o.userId)).size;
  const conversion = totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;
  const arppu = payingUsers > 0 ? totalRevenue / payingUsers : 0;
  const revenue14 = paidOrders
    .filter((o) => o.paidAt && o.paidAt >= start)
    .reduce((s, o) => s + o.amountPaise, 0);

  // ---- Time series (last 14 days) ----
  const revByDay = new Map<string, number>();
  const signByDay = new Map<string, number>();
  const dayKeys: { key: string; label: string }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayKeys.push({ key, label: dayLabel(d) });
    revByDay.set(key, 0);
    signByDay.set(key, 0);
  }
  for (const o of paidOrders) {
    if (!o.paidAt) continue;
    const key = o.paidAt.toISOString().slice(0, 10);
    if (revByDay.has(key)) revByDay.set(key, revByDay.get(key)! + o.amountPaise);
  }
  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (signByDay.has(key)) signByDay.set(key, signByDay.get(key)! + 1);
  }
  const revenueSeries: Point[] = dayKeys.map((d) => ({ label: d.label, value: revByDay.get(d.key)! }));
  const signupSeries: Point[] = dayKeys.map((d) => ({ label: d.label, value: signByDay.get(d.key)! }));

  // ---- Breakdowns ----
  const revByPackage = new Map<string, number>();
  const revBySource = new Map<string, number>();
  for (const o of paidOrders) {
    revByPackage.set(o.package.name, (revByPackage.get(o.package.name) ?? 0) + o.amountPaise);
    const src = o.user.signupSource ?? "(direct)";
    revBySource.set(src, (revBySource.get(src) ?? 0) + o.amountPaise);
  }
  const packageBars: Point[] = [...revByPackage.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const sourceBars: Point[] = [...revBySource.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const outcomeSegments: Segment[] = attemptGroups
    .map((g) => ({
      label: STATUS_LABEL[g.status] ?? g.status,
      value: g._count._all,
      color: STATUS_COLOR[g.status] ?? "#8a8372",
    }))
    .sort((a, b) => b.value - a.value);

  const recent = paidOrders.slice(0, 6);

  return (
    <div className="auth-card auth-card-wide dash">
      <h1>Dashboard</h1>
      <p className="dash-sub">Revenue, growth and exam activity at a glance.</p>

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">{rupees(totalRevenue)}</div>
          <div className="kpi-sub up">
            {rupees(revenue14)} in last {DAYS}d
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Signups</div>
          <div className="kpi-value">{totalUsers.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">
            {recentUsers.length} in last {DAYS}d
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Paying Users</div>
          <div className="kpi-value">{payingUsers.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">{conversion.toFixed(1)}% conversion</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">ARPPU</div>
          <div className="kpi-value">{rupees(arppu)}</div>
          <div className="kpi-sub">per paying user</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Attempts</div>
          <div className="kpi-value">{totalAttempts.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">across all papers</div>
        </div>
      </div>

      {/* Revenue + package mix */}
      <div className="dash-grid">
        <div className="dash-card">
          <h2>Revenue</h2>
          <p className="dash-card-sub">Paid orders per day · last {DAYS} days</p>
          <BarChart data={revenueSeries} color="#c9a227" format={rupeesShort} />
        </div>
        <div className="dash-card">
          <h2>Revenue by package</h2>
          <p className="dash-card-sub">All-time paid</p>
          <HBars data={packageBars} color="#1a2a44" format={rupees} />
        </div>
      </div>

      {/* Signups + outcomes + sources */}
      <div className="dash-grid thirds">
        <div className="dash-card">
          <h2>New signups</h2>
          <p className="dash-card-sub">Per day · last {DAYS} days</p>
          <BarChart data={signupSeries} color="#1a2a44" height={150} />
        </div>
        <div className="dash-card">
          <h2>Exam outcomes</h2>
          <p className="dash-card-sub">All attempts by status</p>
          <Donut segments={outcomeSegments} centerValue={String(totalAttempts)} centerLabel="attempts" />
        </div>
        <div className="dash-card">
          <h2>Revenue by source</h2>
          <p className="dash-card-sub">First-touch acquisition</p>
          <HBars data={sourceBars} color="#1f7a3d" format={rupees} />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="dash-card">
        <h2>Recent transactions</h2>
        <p className="dash-card-sub">Latest paid orders</p>
        {recent.length === 0 ? (
          <p className="dash-empty">No paid orders yet.</p>
        ) : (
          <table className="dash-mini-table">
            <tbody>
              {recent.map((o, i) => (
                <tr key={i}>
                  <td>{o.user.name ?? o.user.phone ?? "—"}</td>
                  <td className="muted-cell">{o.package.name}</td>
                  <td>{o.paidAt ? o.paidAt.toLocaleDateString("en-IN") : "—"}</td>
                  <td className="amt">{rupees(o.amountPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
