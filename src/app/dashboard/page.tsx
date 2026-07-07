import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { assertUploadAllowed, ForbiddenError } from "@/lib/auth/uploadGate";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";

export default async function DashboardPage() {
  const { userId, user } = await verifySession();

  const [credit, freePaper, attemptedPaperIds] = await Promise.all([
    prisma.userCredit.findUnique({ where: { userId } }),
    prisma.paper.findFirst({ where: { isFree: true, isActive: true } }),
    prisma.attempt.findMany({ where: { userId }, select: { paperId: true } }),
  ]);

  const attemptedSet = new Set(attemptedPaperIds.map((a) => a.paperId));
  const freeAttemptTaken = freePaper ? attemptedSet.has(freePaper.id) : false;

  const nextPaidPaper =
    credit && credit.testsRemaining > 0
      ? await prisma.paper.findFirst({
          where: { isFree: false, isActive: true, id: { notIn: [...attemptedSet] } },
          orderBy: { sequenceNo: "asc" },
        })
      : null;

  let canUpload = false;
  try {
    assertUploadAllowed(user.phone);
    canUpload = true;
  } catch (err) {
    if (!(err instanceof ForbiddenError)) throw err;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Welcome{user.name ? `, ${user.name}` : ""}</h1>
        <p className="muted">{user.phone ?? user.email ?? ""}</p>

        <section className="dashboard-section">
          <h2>Free Mock Test</h2>
          {!freePaper && <p>Coming soon — the exam engine is being built next.</p>}
          {freePaper && freeAttemptTaken && <p>You have already used your free mock test.</p>}
          {freePaper && !freeAttemptTaken && <Link href={`/exam/${freePaper.id}`}>Start Free Mock Test →</Link>}
        </section>

        <section className="dashboard-section">
          <h2>Tests Remaining</h2>
          <p>{credit?.testsRemaining ?? 0} paid test(s) remaining</p>
          {nextPaidPaper && <Link href={`/exam/${nextPaidPaper.id}`}>Start Next Test →</Link>}
          {(!credit || credit.testsRemaining === 0) && (
            <p>
              <Link href="/packages">Buy a test package →</Link>
            </p>
          )}
        </section>

        <nav className="dashboard-nav">
          <Link href="/profile">Edit Profile</Link>
          <Link href="/packages">Buy Tests</Link>
          <Link href="/history">Practice History</Link>
          <Link href="/purchases">Purchase History</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/about">About</Link>
          <Link href="/disclaimer">Disclaimer</Link>
          {canUpload && <Link href="/upload">Upload Questions</Link>}
          <form action={logoutAction}>
            <button type="submit" className="auth-secondary">
              Log out
            </button>
          </form>
        </nav>
      </div>
    </main>
  );
}
