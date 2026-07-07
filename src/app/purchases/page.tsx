import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function PurchasesPage() {
  const { userId } = await verifySession();

  const orders = await prisma.order.findMany({
    where: { userId, status: "paid" },
    include: { package: { select: { name: true, testCount: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Purchase History</h1>

        {orders.length === 0 && (
          <p className="muted">
            You haven&apos;t purchased a test package yet. Purchases will appear here once you buy
            one.
          </p>
        )}

        {orders.length > 0 && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Tests</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.package.name}</td>
                  <td>{order.package.testCount}</td>
                  <td>₹{(order.amountPaise / 100).toFixed(2)}</td>
                  <td>{order.paidAt?.toLocaleDateString() ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <nav className="dashboard-nav">
          <Link href="/dashboard" className="auth-secondary-link">
            Back to dashboard
          </Link>
        </nav>
      </div>
    </main>
  );
}
