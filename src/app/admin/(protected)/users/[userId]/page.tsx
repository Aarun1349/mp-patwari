import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  OBC: "OBC",
  SC: "SC",
  ST: "ST",
  EWS: "EWS",
};

const QUALIFICATION_LABELS: Record<string, string> = {
  TENTH: "10th pass",
  TWELFTH: "12th pass",
  GRADUATE: "Graduate",
  POST_GRADUATE: "Post-graduate",
  OTHER: "Other",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      credit: true,
      attempts: {
        include: { paper: { select: { title: true, totalMarks: true } } },
        orderBy: { startedAt: "desc" },
        take: 20,
      },
      orders: {
        include: { package: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!user) notFound();

  return (
    <>
      <div className="auth-card" style={{ maxWidth: "560px" }}>
        <h1>{user.name ?? "Unnamed user"}</h1>
        <p className="muted">
          <Link href="/admin/users">← Back to Users</Link>
        </p>

        <table className="report-table">
          <tbody>
            <tr>
              <td>Phone (login)</td>
              <td>{user.phone ?? "—"}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>
                {user.email ?? "—"} {user.email && (user.emailVerified ? "(verified)" : "(unverified)")}
              </td>
            </tr>
            <tr>
              <td>Contact number</td>
              <td>{user.contactPhone ?? "—"}</td>
            </tr>
            <tr>
              <td>Date of birth</td>
              <td>{user.dateOfBirth ? user.dateOfBirth.toLocaleDateString() : "—"}</td>
            </tr>
            <tr>
              <td>City / District</td>
              <td>{user.city ?? "—"}</td>
            </tr>
            <tr>
              <td>Category</td>
              <td>{user.category ? CATEGORY_LABELS[user.category] : "—"}</td>
            </tr>
            <tr>
              <td>Qualification</td>
              <td>{user.qualification ? QUALIFICATION_LABELS[user.qualification] : "—"}</td>
            </tr>
            <tr>
              <td>Exam interest</td>
              <td>{user.examInterest ?? "—"}</td>
            </tr>
            <tr>
              <td>Joined</td>
              <td>{user.createdAt.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Last login</td>
              <td>{user.lastLoginAt ? user.lastLoginAt.toLocaleString() : "—"}</td>
            </tr>
            <tr>
              <td>Tests remaining</td>
              <td>{user.credit?.testsRemaining ?? 0}</td>
            </tr>
            <tr>
              <td>Tests purchased (lifetime)</td>
              <td>{user.credit?.testsTotalPurchased ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="auth-card auth-card-wide" style={{ marginTop: "20px" }}>
        <h2>Recent Attempts</h2>
        {user.attempts.length === 0 && <p className="muted">No attempts yet.</p>}
        {user.attempts.length > 0 && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Paper</th>
                <th>Status</th>
                <th>Score</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {user.attempts.map((a) => (
                <tr key={a.id}>
                  <td>{a.paper.title}</td>
                  <td>{a.status}</td>
                  <td>{a.totalScore != null ? `${a.totalScore}/${a.paper.totalMarks}` : "—"}</td>
                  <td>{a.startedAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="auth-card auth-card-wide" style={{ marginTop: "20px" }}>
        <h2>Recent Orders</h2>
        {user.orders.length === 0 && <p className="muted">No orders yet.</p>}
        {user.orders.length > 0 && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {user.orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.package.name}</td>
                  <td>₹{(o.amountPaise / 100).toFixed(2)}</td>
                  <td>{o.status}</td>
                  <td>{o.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
