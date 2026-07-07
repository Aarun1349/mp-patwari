import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { finalizeAttempt } from "@/lib/exam/finalize";

const TERMINAL_STATUSES = ["submitted", "expired", "locked"];

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/exam/[attemptId]/heartbeat">
) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId } = await ctx.params;
  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (TERMINAL_STATUSES.includes(attempt.status)) {
    return NextResponse.json({
      status: attempt.status,
      remainingSeconds: 0,
      totalScore: attempt.totalScore,
      accuracyPct: attempt.accuracyPct,
    });
  }

  const remainingSeconds = Math.max(0, Math.floor((attempt.endsAt.getTime() - Date.now()) / 1000));

  if (remainingSeconds <= 0) {
    const result = await finalizeAttempt(attemptId, "expired");
    return NextResponse.json({ remainingSeconds: 0, ...result });
  }

  return NextResponse.json({
    status: attempt.status,
    remainingSeconds,
    fullscreenExitCount: attempt.fullscreenExitCount,
  });
}
