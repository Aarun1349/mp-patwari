import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buildSectionReport } from "@/lib/exam/report";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { userId } = await verifySession();

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

  const timeTaken = attempt.submittedAt
    ? formatDuration(attempt.submittedAt.getTime() - attempt.startedAt.getTime())
    : "—";

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

  return (
    <main className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>{attempt.paper.title}</h1>
        <p className="muted">Status: {attempt.status}</p>

        <section className="dashboard-section">
          <p>
            Score: {attempt.totalScore ?? 0} / {attempt.paper.totalMarks}
          </p>
          <p>Accuracy: {attempt.accuracyPct?.toFixed(1) ?? 0}%</p>
          <p>Time taken: {timeTaken}</p>
        </section>

        <section className="dashboard-section">
          <h2>Section-wise breakdown</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Attempted</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {sectionRows.map((row) => (
                <tr key={row.sectionId}>
                  <td>{row.nameEn}</td>
                  <td>
                    {row.attempted}/{row.totalQuestions}
                  </td>
                  <td>{row.correct}</td>
                  <td>{row.incorrect}</td>
                  <td>
                    {row.marksScored}/{row.maxMarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {previousAttempt && (
          <section className="dashboard-section">
            <h2>Compared to your last attempt</h2>
            <p>
              Score: {attempt.totalScore ?? 0} vs {previousAttempt.totalScore ?? 0}{" "}
              {scoreDelta !== null && (
                <strong style={{ color: scoreDelta >= 0 ? "#2a7a2a" : "#a3242a" }}>
                  ({scoreDelta >= 0 ? "+" : ""}
                  {scoreDelta})
                </strong>
              )}
            </p>
            <p>
              Accuracy: {attempt.accuracyPct?.toFixed(1) ?? 0}% vs {previousAttempt.accuracyPct?.toFixed(1) ?? 0}%{" "}
              {accuracyDelta !== null && (
                <strong style={{ color: accuracyDelta >= 0 ? "#2a7a2a" : "#a3242a" }}>
                  ({accuracyDelta >= 0 ? "+" : ""}
                  {accuracyDelta.toFixed(1)}%)
                </strong>
              )}
            </p>
          </section>
        )}

        <p className="muted">Comparison with other users&apos; performance is coming in a future update.</p>

        <nav className="dashboard-nav">
          <Link href="/history">View All Attempts</Link>
          <Link href="/dashboard" className="auth-secondary-link">
            Back to dashboard
          </Link>
        </nav>
      </div>
    </main>
  );
}
