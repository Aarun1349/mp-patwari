import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/app/AppShell";
import { getPaperAttemptSummary } from "@/lib/exam/entitlement";
import { getDefaultExamId } from "@/lib/exam/defaultExam";

export default async function DashboardPage() {
  const { userId, user } = await verifySession();

  // Single-exam phase: scope to the active exam. Becomes the selected exam in Phase 3.
  const examId = await getDefaultExamId();

  const [credit, freePaper, attemptedPaperIds] = await Promise.all([
    prisma.userCredit.findUnique({ where: { userId_examId: { userId, examId } } }),
    prisma.paper.findFirst({ where: { isFree: true, isActive: true } }),
    prisma.attempt.findMany({ where: { userId }, select: { paperId: true } }),
  ]);

  const attemptedSet = new Set(attemptedPaperIds.map((a) => a.paperId));
  const freeSummary = freePaper ? await getPaperAttemptSummary(userId, freePaper.id) : null;

  const nextPaidPaper =
    credit && credit.testsRemaining > 0
      ? await prisma.paper.findFirst({
          where: { isFree: false, isActive: true, id: { notIn: [...attemptedSet] } },
          orderBy: { sequenceNo: "asc" },
        })
      : null;

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Welcome{user.name ? `, ${user.name}` : ""}</h1>
        <p className="muted">{user.phone ?? user.email ?? ""}</p>

        <div className="dashboard-highlight">
          <h2>Free Mock Test</h2>
          {!freePaper && <p>Coming soon — the exam engine is being built next.</p>}
          {freePaper && freeSummary && (
            <>
              {freeSummary.resumableAttemptId && (
                <Link href={`/exam/attempt/${freeSummary.resumableAttemptId}`}>Resume Free Mock Test →</Link>
              )}
              {!freeSummary.resumableAttemptId && freeSummary.terminalAttemptCount >= freeSummary.maxAttempts && (
                <p>
                  You&apos;ve used all {freeSummary.maxAttempts} attempts for the free test.{" "}
                  {freeSummary.latestTerminalAttemptId && (
                    <Link href={`/exam/result/${freeSummary.latestTerminalAttemptId}`}>View last result</Link>
                  )}
                </p>
              )}
              {!freeSummary.resumableAttemptId && freeSummary.terminalAttemptCount < freeSummary.maxAttempts && (
                <Link href={`/exam/${freePaper.id}`}>
                  {freeSummary.terminalAttemptCount === 0
                    ? "Start Free Mock Test →"
                    : `Retake Free Mock Test (${freeSummary.terminalAttemptCount}/${freeSummary.maxAttempts} used) →`}
                </Link>
              )}
            </>
          )}
        </div>

        <div className="dashboard-highlight">
          <h2>Tests Remaining</h2>
          <p>{credit?.testsRemaining ?? 0} paid test(s) remaining</p>
          {nextPaidPaper && <Link href={`/exam/${nextPaidPaper.id}`}>Start Next Test →</Link>}
          {(!credit || credit.testsRemaining === 0) && <Link href="/packages">Buy a test package →</Link>}
        </div>

        <nav className="dashboard-links-grid">
          <Link href="/profile">Edit Profile</Link>
          <Link href="/packages">Buy Tests</Link>
          <Link href="/history">Practice History</Link>
          <Link href="/purchases">Purchase History</Link>
        </nav>
      </div>
    </AppShell>
  );
}
