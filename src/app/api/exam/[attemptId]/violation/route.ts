import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { finalizeAttempt } from "@/lib/exam/finalize";
import { assertSameOrigin } from "@/lib/security/sameOrigin";
import { prisma } from "@/lib/prisma";

const LOCK_THRESHOLD = 3;

const BodySchema = z.object({
  type: z.enum(["fullscreen_exit", "visibility_hidden", "tab_blur"]),
});

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/exam/[attemptId]/violation">
) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId } = await ctx.params;
  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Ignore violations reported after the attempt is already terminal — a
  // slow client-side event firing after the game is over should be a no-op.
  if (!["in_progress", "paused"].includes(attempt.status)) {
    return NextResponse.json({ status: attempt.status });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  const type = parsed.success ? parsed.data.type : "unknown";
  console.log(`exam violation: attempt=${attemptId} type=${type}`);

  // Conditional write: only mutate if the attempt is still non-terminal at
  // write time. If another request (e.g. a concurrent violation or the
  // heartbeat's expiry check) already moved it to a terminal status, this is
  // a no-op rather than corrupting counters on an already-finished attempt.
  const flip = await prisma.attempt.updateMany({
    where: { id: attemptId, status: { in: ["in_progress", "paused"] } },
    data: { fullscreenExitCount: { increment: 1 }, flagged: true },
  });

  if (flip.count === 0) {
    const current = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
    return NextResponse.json({ status: current.status, fullscreenExitCount: current.fullscreenExitCount });
  }

  const updated = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });

  if (updated.fullscreenExitCount >= LOCK_THRESHOLD) {
    const result = await finalizeAttempt(attemptId, "locked");
    return NextResponse.json({ fullscreenExitCount: updated.fullscreenExitCount, ...result });
  }

  await prisma.attempt.updateMany({
    where: { id: attemptId, status: "in_progress" },
    data: { status: "paused" },
  });

  return NextResponse.json({ status: "paused", fullscreenExitCount: updated.fullscreenExitCount });
}
