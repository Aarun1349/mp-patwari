import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getStudentSectionWeakness } from "@/lib/exam/studentAnalytics";

// Teacher-facing colour cue for accuracy — red = weak, amber = shaky, green = solid.
function accuracyColor(pct: number): string {
  if (pct < 50) return "#c0392b";
  if (pct < 65) return "#b9770e";
  return "#1e7a3d";
}

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
  await requirePagePermission(PERMISSIONS.STUDENT_READ);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      credits: true,
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

  const weakness = await getStudentSectionWeakness(userId);
  const weakest = weakness.rows.filter((r) => r.attempted > 0).slice(0, 2);

  return (
    <>
      <div className="auth-card" style={{ maxWidth: "560px", marginLeft: 0, marginRight: 0 }}>
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
              <td>{user.credits.reduce((s, c) => s + c.testsRemaining, 0)}</td>
            </tr>
            <tr>
              <td>Tests purchased (lifetime)</td>
              <td>{user.credits.reduce((s, c) => s + c.testsTotalPurchased, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="auth-card auth-card-wide" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <div>
            <h2>Preparation X-ray</h2>
            <p className="page-subtitle">Where this student is actually weak — across {weakness.attemptCount} completed test(s).</p>
          </div>
        </div>
        {weakness.attemptCount === 0 && <p className="muted">No completed tests yet — the x-ray fills in once the student submits a mock.</p>}
        {weakness.attemptCount > 0 && (
          <>
            {weakest.length > 0 && (
              <p style={{ marginTop: "-4px", marginBottom: "16px" }}>
                <strong>Weakest areas:</strong>{" "}
                {weakest.map((r, i) => (
                  <span key={r.code}>
                    {i > 0 && ", "}
                    <span style={{ color: accuracyColor(r.accuracyPct), fontWeight: 600 }}>
                      {r.nameEn} ({r.accuracyPct}%)
                    </span>
                  </span>
                ))}
              </p>
            )}
            <table className="report-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Accuracy</th>
                  <th>Correct / Attempted</th>
                  <th>Skipped</th>
                  <th>Marks lost</th>
                </tr>
              </thead>
              <tbody>
                {weakness.rows.map((r) => (
                  <tr key={r.code}>
                    <td>{r.nameEn}</td>
                    <td style={{ color: accuracyColor(r.accuracyPct), fontWeight: 600 }}>
                      {r.attempted > 0 ? `${r.accuracyPct}%` : "—"}
                    </td>
                    <td>
                      {r.correct} / {r.attempted}
                    </td>
                    <td>{r.skipped}</td>
                    <td>{r.marksLost > 0 ? `−${r.marksLost.toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
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
