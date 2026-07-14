import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buildSectionReport } from "@/lib/exam/report";
import { AppShell } from "@/app/AppShell";
import "../result.css";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  locked: "Locked",
  expired: "Time expired",
};

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { userId, user } = await verifySession();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: true, answers: true },
  });

  if (!attempt || attempt.userId !== userId) notFound();
  if (["in_progress", "paused"].includes(attempt.status)) {
    redirect(`/exam/attempt/${attemptId}`);
  }

  const questions = await prisma.question.findMany({
    where: { paperId: attempt.paperId, isActive: true },
    include: {
      section: { select: { code: true, nameEn: true, sortOrder: true } },
      options: { where: { isCorrect: true }, take: 1 },
    },
  });

  const sectionRows = buildSectionReport(
    questions.map((q) => ({
      id: q.id,
      sectionId: q.sectionId,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      correctOptionId: q.options[0]?.id ?? null,
      section: q.section,
    })),
    attempt.answers
  );

  // Roll-up totals for the hero cards.
  const totals = sectionRows.reduce(
    (acc, r) => ({
      questions: acc.questions + r.totalQuestions,
      attempted: acc.attempted + r.attempted,
      correct: acc.correct + r.correct,
      incorrect: acc.incorrect + r.incorrect,
      maxMarks: acc.maxMarks + r.maxMarks,
    }),
    { questions: 0, attempted: 0, correct: 0, incorrect: 0, maxMarks: 0 }
  );
  const unattempted = Math.max(0, totals.questions - totals.attempted);

  const totalMarks = attempt.paper.totalMarks || totals.maxMarks;
  const score = attempt.totalScore ?? 0;
  const accuracy = attempt.accuracyPct ?? 0;
  const scorePct = totalMarks > 0 ? Math.max(0, Math.min(100, (score / totalMarks) * 100)) : 0;

  const timeTaken = attempt.submittedAt
    ? formatDuration(attempt.submittedAt.getTime() - attempt.startedAt.getTime())
    : "—";

  // Accuracy ring geometry.
  const RING_R = 34;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - Math.max(0, Math.min(100, accuracy)) / 100);

  const previousAttempt = await prisma.attempt.findFirst({
    where: {
      userId,
      paperId: attempt.paperId,
      id: { not: attempt.id },
      status: { in: ["submitted", "expired", "locked"] },
      startedAt: { lt: attempt.startedAt },
    },
    orderBy: { startedAt: "desc" },
    select: { totalScore: true, accuracyPct: true, startedAt: true },
  });

  const scoreDelta =
    previousAttempt?.totalScore != null && attempt.totalScore != null
      ? attempt.totalScore - previousAttempt.totalScore
      : null;
  const accuracyDelta =
    previousAttempt?.accuracyPct != null && attempt.accuracyPct != null
      ? attempt.accuracyPct - previousAttempt.accuracyPct
      : null;

  const statusClass = attempt.status in STATUS_LABEL ? attempt.status : "submitted";

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="res-page">
        <div className="res-shell">
        <header className="res-header">
          <div>
            <h1>{attempt.paper.title}</h1>
            <p className="res-sub">Result summary</p>
          </div>
          <span className={`res-pill ${statusClass}`}>{STATUS_LABEL[attempt.status] ?? attempt.status}</span>
        </header>

        <div className="res-body">
          {attempt.status === "locked" && (
            <p className="res-note">
              This attempt was auto-submitted after repeated fullscreen / tab-switch violations. Scores below reflect
              only the answers recorded before it was locked.
            </p>
          )}

          {/* Hero stats */}
          <div className="res-hero">
            <div className="res-stat">
              <span className="res-stat-label">Score</span>
              <span className="res-stat-value">
                {score}
                <small> / {totalMarks}</small>
              </span>
              <div className="res-bar">
                <span style={{ width: `${scorePct}%` }} />
              </div>
            </div>

            <div className="res-stat">
              <span className="res-stat-label">Accuracy</span>
              <div className="res-ring-wrap">
                <svg className="res-ring" width="82" height="82" viewBox="0 0 82 82">
                  <circle className="track" cx="41" cy="41" r={RING_R} />
                  <circle
                    className="value"
                    cx="41"
                    cy="41"
                    r={RING_R}
                    strokeDasharray={RING_C}
                    strokeDashoffset={ringOffset}
                  />
                  <text
                    x="41"
                    y="41"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="17"
                    fontWeight="800"
                    fill="#1a2a44"
                  >
                    {accuracy.toFixed(0)}%
                  </text>
                </svg>
                <span className="res-ring-text">
                  <b>{totals.correct}</b> correct of {totals.attempted} attempted
                </span>
              </div>
            </div>

            <div className="res-stat">
              <span className="res-stat-label">Answers</span>
              <div className="res-split">
                <div className="correct">
                  <span className="n">{totals.correct}</span>
                  <span className="l">Correct</span>
                </div>
                <div className="incorrect">
                  <span className="n">{totals.incorrect}</span>
                  <span className="l">Wrong</span>
                </div>
                <div>
                  <span className="n">{unattempted}</span>
                  <span className="l">Skipped</span>
                </div>
              </div>
            </div>

            <div className="res-stat">
              <span className="res-stat-label">Time taken</span>
              <span className="res-stat-value" style={{ fontSize: "26px" }}>
                {timeTaken}
              </span>
              <span className="res-stat-hint">of {attempt.paper.durationMinutes} min allowed</span>
            </div>
          </div>

          {/* Section-wise breakdown */}
          <section className="res-section">
            <h2 className="res-h2">Section-wise breakdown</h2>
            <div className="res-table-wrap">
              <table className="res-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th className="num">Attempted</th>
                    <th className="num">Correct</th>
                    <th className="num">Incorrect</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionRows.map((row) => {
                    const pct = row.maxMarks > 0 ? Math.max(0, (row.marksScored / row.maxMarks) * 100) : 0;
                    const barColor = pct >= 60 ? "#1f7a3d" : pct >= 33 ? "#c9a227" : "#b3261e";
                    return (
                      <tr key={row.sectionId}>
                        <td className="sec-name">{row.nameEn}</td>
                        <td className="num muted-cell">
                          {row.attempted}/{row.totalQuestions}
                        </td>
                        <td className="num chip-correct">{row.correct}</td>
                        <td className="num chip-incorrect">{row.incorrect}</td>
                        <td className="res-marks-cell">
                          <div className="res-marks-top">
                            <b>{row.marksScored}</b>
                            <span className="muted-cell">/ {row.maxMarks}</span>
                          </div>
                          <div className="res-mini-bar">
                            <span style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="num">
                      {totals.attempted}/{totals.questions}
                    </td>
                    <td className="num">{totals.correct}</td>
                    <td className="num">{totals.incorrect}</td>
                    <td>
                      {score} / {totalMarks}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Comparison */}
          {previousAttempt && (
            <section className="res-section">
              <h2 className="res-h2">Compared to your last attempt</h2>
              <div className="res-compare">
                <div className="res-compare-card">
                  <span className="l">Score</span>
                  <div className="row">
                    <span className="cur">{attempt.totalScore ?? 0}</span>
                    <span className="prev">was {previousAttempt.totalScore ?? 0}</span>
                    {scoreDelta !== null && (
                      <span className={`res-delta ${scoreDelta >= 0 ? "up" : "down"}`}>
                        {scoreDelta >= 0 ? "▲ +" : "▼ "}
                        {scoreDelta}
                      </span>
                    )}
                  </div>
                </div>
                <div className="res-compare-card">
                  <span className="l">Accuracy</span>
                  <div className="row">
                    <span className="cur">{attempt.accuracyPct?.toFixed(1) ?? 0}%</span>
                    <span className="prev">was {previousAttempt.accuracyPct?.toFixed(1) ?? 0}%</span>
                    {accuracyDelta !== null && (
                      <span className={`res-delta ${accuracyDelta >= 0 ? "up" : "down"}`}>
                        {accuracyDelta >= 0 ? "▲ +" : "▼ "}
                        {accuracyDelta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          <p className="res-future">Comparison with other students&apos; performance is coming in a future update.</p>

          <div className="res-actions">
            <Link href="/history" className="res-btn res-btn-primary">
              View All Attempts
            </Link>
            <Link href="/dashboard" className="res-btn res-btn-ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
        </div>
      </div>
    </AppShell>
  );
}
