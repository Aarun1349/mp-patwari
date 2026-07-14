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

  const completedCount = attempts.filter((a) => TERMINAL_STATUSES.has(a.status)).length;
  const scored = attempts.filter((a) => TERMINAL_STATUSES.has(a.status) && a.totalScore != null);
  const bestAttempt = scored.length
    ? scored.reduce((best, a) => (a.totalScore! > best.totalScore! ? a : best))
    : null;
  const bestScore = bestAttempt?.totalScore ?? null;
  const avgAccuracy = scored.length
    ? scored.reduce((sum, a) => sum + (a.accuracyPct ?? 0), 0) / scored.length
    : null;
  const lastAttemptDate = attempts.length ? attempts[0].startedAt : null;

  const accColor = (pct: number) => (pct >= 60 ? "#1f7a3d" : pct >= 33 ? "#c9a227" : "#b3261e");

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Practice History</h1>
        <p className="page-subtitle">Your attempts, scores and accuracy across every mock test.</p>

        {attempts.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 3 3 5-6" />
              </svg>
            </span>
            <h2>No attempts yet</h2>
            <p>
              You haven&apos;t taken a mock test yet. Start your free full-length test to see your score,
              accuracy and section-wise analysis here.
            </p>
            <Link href="/dashboard" className="empty-cta">
              Start a Mock Test
            </Link>
          </div>
        )}

        {attempts.length > 0 && (
          <>
            <div className="stat-tile-row">
              <div className="stat-tile">
                <div className="stat-label">Total Attempts</div>
                <div className="stat-value">{attempts.length}</div>
                <div className="stat-sub">{completedCount} completed</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Best Score</div>
                <div className="stat-value">
                  {bestScore != null ? bestScore : "—"}
                  {bestAttempt && <small> / {bestAttempt.paper.totalMarks}</small>}
                </div>
                <div className="stat-sub">{bestScore != null ? "highest so far" : "no scored tests yet"}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Average Accuracy</div>
                <div className="stat-value">{avgAccuracy != null ? `${avgAccuracy.toFixed(1)}%` : "—"}</div>
                {avgAccuracy != null && (
                  <div className="mini-acc">
                    <span style={{ width: `${Math.min(100, avgAccuracy)}%`, background: accColor(avgAccuracy) }} />
                  </div>
                )}
              </div>
              <div className="stat-tile">
                <div className="stat-label">Last Attempt</div>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {lastAttemptDate ? lastAttemptDate.toLocaleDateString() : "—"}
                </div>
                <div className="stat-sub">most recent</div>
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
                      <td>
                        {isTerminal ? (
                          <>
                            {attempt.accuracyPct?.toFixed(1) ?? 0}%
                            <div className="mini-acc">
                              <span
                                style={{
                                  width: `${Math.min(100, attempt.accuracyPct ?? 0)}%`,
                                  background: accColor(attempt.accuracyPct ?? 0),
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {isTerminal ? (
                          <div className="table-actions">
                            <Link href={`/exam/result/${attempt.id}`} className="action-primary">
                              View report
                            </Link>
                            {canRetakeHere && (
                              <Link href={`/exam/${attempt.paperId}`}>
                                Retake ({paperInfo.terminalCount}/{MAX_ATTEMPTS_PER_PAPER})
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="table-actions">
                            <Link href={`/exam/attempt/${attempt.id}`} className="action-primary">
                              Resume
                            </Link>
                          </div>
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
