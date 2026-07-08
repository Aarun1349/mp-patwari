import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { canUploadContent } from "@/lib/auth/uploadGate";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/app/AppShell";

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

  const canUpload = canUploadContent(user.phone);

  return (
    <AppShell userLabel={user.phone ?? user.email ?? ""} canUpload={canUpload}>
      <div className="auth-card auth-card-wide">
        <h1>Welcome{user.name ? `, ${user.name}` : ""}</h1>
        <p className="muted">{user.phone ?? user.email ?? ""}</p>

        <div className="dashboard-highlight">
          <h2>Free Mock Test</h2>
          {!freePaper && <p>Coming soon — the exam engine is being built next.</p>}
          {freePaper && freeAttemptTaken && <p>You have already used your free mock test.</p>}
          {freePaper && !freeAttemptTaken && <Link href={`/exam/${freePaper.id}`}>Start Free Mock Test →</Link>}
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
          {canUpload && <Link href="/upload">Upload Questions</Link>}
        </nav>
      </div>
    </AppShell>
  );
}
