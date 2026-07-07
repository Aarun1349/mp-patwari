import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { finalizeAttempt } from "@/lib/exam/finalize";
import { assertSameOrigin } from "@/lib/security/sameOrigin";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/exam/[attemptId]/submit">
) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId } = await ctx.params;
  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!["in_progress", "paused"].includes(attempt.status)) {
    return NextResponse.json({ status: attempt.status });
  }

  const result = await finalizeAttempt(attemptId, "submitted");
  return NextResponse.json(result);
}
