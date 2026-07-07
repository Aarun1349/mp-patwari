import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const TERMINAL_STATUSES = new Set(["submitted", "expired", "locked"]);

export default async function HistoryPage() {
  const { userId } = await verifySession();

  const attempts = await prisma.attempt.findMany({
    where: { userId },
    include: { paper: { select: { title: true, totalMarks: true } } },
    orderBy: { startedAt: "desc" },
  });

  return (
    <main className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Practice History</h1>

        {attempts.length === 0 && <p className="muted">You haven&apos;t attempted any test yet.</p>}

        {attempts.length > 0 && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th>Status</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const isTerminal = TERMINAL_STATUSES.has(attempt.status);
                return (
                  <tr key={attempt.id}>
                    <td>{attempt.paper.title}</td>
                    <td>{attempt.startedAt.toLocaleDateString()}</td>
                    <td>{attempt.status}</td>
                    <td>{isTerminal ? `${attempt.totalScore ?? 0}/${attempt.paper.totalMarks}` : "—"}</td>
                    <td>{isTerminal ? `${attempt.accuracyPct?.toFixed(1) ?? 0}%` : "—"}</td>
                    <td>
                      {isTerminal ? (
                        <Link href={`/exam/result/${attempt.id}`}>View report</Link>
                      ) : (
                        <Link href={`/exam/attempt/${attempt.id}`}>Resume</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
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
