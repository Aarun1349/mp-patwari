import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { prisma } from "@/lib/prisma";
import { MAX_ATTEMPTS_PER_PAPER } from "@/lib/exam/entitlement";

const TERMINAL_STATUSES = new Set(["submitted", "expired", "locked"]);
const NON_TERMINAL_STATUSES = new Set(["in_progress", "paused"]);

const STATUS_STYLE: Record<string, string> = {
  submitted: "status-good",
  in_progress: "status-pending",
  paused: "status-pending",
  locked: "status-bad",
  expired: "status-neutral",
};

export default async function HistoryPage() {
  const { userId, user } = await verifySession();

  const attempts = await prisma.attempt.findMany({
    where: { userId },
    include: { paper: { select: { title: true, totalMarks: true, isActive: true } } },
    orderBy: { startedAt: "desc" },
  });

  // Per paper: does an in-progress/paused attempt already exist, how many
  // terminal attempts exist, and which is the most recent attempt overall —
  // only that most-recent row gets the Retake link, to avoid repeating it on
  // every old row for the same paper.
  const perPaper = new Map<string, { hasResumable: boolean; terminalCount: number; latestAttemptId: string }>();
  for (const attempt of attempts) {
    let entry = perPaper.get(attempt.paperId);
    if (!entry) {
      entry = { hasResumable: false, terminalCount: 0, latestAttemptId: attempt.id };
      perPaper.set(attempt.paperId, entry);
    }
    if (NON_TERMINAL_STATUSES.has(attempt.status)) entry.hasResumable = true;
    if (TERMINAL_STATUSES.has(attempt.status)) entry.terminalCount++;
  }

  const scored = attempts.filter((a) => TERMINAL_STATUSES.has(a.status) && a.totalScore != null);
  const bestScore = scored.length ? Math.max(...scored.map((a) => a.totalScore!)) : null;
  const avgAccuracy = scored.length
    ? scored.reduce((sum, a) => sum + (a.accuracyPct ?? 0), 0) / scored.length
    : null;

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Practice History</h1>

        {attempts.length === 0 && <p className="muted">You haven&apos;t attempted any test yet.</p>}

        {attempts.length > 0 && (
          <>
            <div className="stat-tile-row">
              <div className="stat-tile">
                <div className="stat-label">Total Attempts</div>
                <div className="stat-value">{attempts.length}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Best Score</div>
                <div className="stat-value">{bestScore != null ? bestScore : "—"}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Average Accuracy</div>
                <div className="stat-value">{avgAccuracy != null ? `${avgAccuracy.toFixed(1)}%` : "—"}</div>
              </div>
            </div>

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
                  const paperInfo = perPaper.get(attempt.paperId)!;
                  const canRetakeHere =
                    isTerminal &&
                    attempt.id === paperInfo.latestAttemptId &&
                    !paperInfo.hasResumable &&
                    paperInfo.terminalCount < MAX_ATTEMPTS_PER_PAPER &&
                    attempt.paper.isActive;

                  return (
                    <tr key={attempt.id}>
                      <td>{attempt.paper.title}</td>
                      <td>{attempt.startedAt.toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${STATUS_STYLE[attempt.status] ?? "status-neutral"}`}>
                          {attempt.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{isTerminal ? `${attempt.totalScore ?? 0}/${attempt.paper.totalMarks}` : "—"}</td>
                      <td>{isTerminal ? `${attempt.accuracyPct?.toFixed(1) ?? 0}%` : "—"}</td>
                      <td>
                        {isTerminal ? (
                          <>
                            <Link href={`/exam/result/${attempt.id}`}>View report</Link>
                            {canRetakeHere && (
                              <>
                                {" · "}
                                <Link href={`/exam/${attempt.paperId}`}>
                                  Retake ({paperInfo.terminalCount}/{MAX_ATTEMPTS_PER_PAPER})
                                </Link>
                              </>
                            )}
                          </>
                        ) : (
                          <Link href={`/exam/attempt/${attempt.id}`}>Resume</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </AppShell>
  );
}
