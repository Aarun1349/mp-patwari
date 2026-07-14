import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { prisma } from "@/lib/prisma";

export default async function PurchasesPage() {
  const { userId, user } = await verifySession();

  const orders = await prisma.order.findMany({
    where: { userId, status: "paid" },
    include: { package: { select: { name: true, testCount: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = orders.reduce((sum, o) => sum + o.amountPaise, 0);
  const totalTests = orders.reduce((sum, o) => sum + o.package.testCount, 0);

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Purchase History</h1>
        <p className="page-subtitle">Every test package you&apos;ve bought, with amounts and dates.</p>

        {orders.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <h2>No purchases yet</h2>
            <p>
              You haven&apos;t bought a test package yet. Browse our packages to unlock more full-length
              mock tests with section-wise analysis.
            </p>
            <Link href="/packages" className="empty-cta">
              Browse Test Packages
            </Link>
          </div>
        )}

        {orders.length > 0 && (
          <>
            <div className="stat-tile-row">
              <div className="stat-tile">
                <div className="stat-label">Total Purchases</div>
                <div className="stat-value">{orders.length}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Total Tests Bought</div>
                <div className="stat-value">{totalTests}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Total Spent</div>
                <div className="stat-value">₹{(totalSpent / 100).toFixed(0)}</div>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Tests</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.package.name}</td>
                    <td>{order.package.testCount}</td>
                    <td>₹{(order.amountPaise / 100).toFixed(2)}</td>
                    <td>{order.paidAt?.toLocaleDateString() ?? "—"}</td>
                    <td>
                      <span className="status-badge status-good">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </AppShell>
  );
}
