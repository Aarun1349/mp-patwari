import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { assertSameOrigin } from "@/lib/security/sameOrigin";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/exam/[attemptId]/resume">
) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId } = await ctx.params;
  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Deliberately does not touch endsAt — the clock keeps running through a
  // pause so a user can't "bank" time by deliberately exiting fullscreen.
  const result = await prisma.attempt.updateMany({
    where: { id: attemptId, status: "paused" },
    data: { status: "in_progress" },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not resumable", status: attempt.status }, { status: 409 });
  }

  return NextResponse.json({ status: "in_progress" });
}
