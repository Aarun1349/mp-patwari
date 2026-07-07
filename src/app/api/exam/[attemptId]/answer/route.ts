import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin } from "@/lib/security/sameOrigin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1).nullable(),
  markedForReview: z.boolean(),
});

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/exam/[attemptId]/answer">
) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId } = await ctx.params;
  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (attempt.status !== "in_progress") {
    return NextResponse.json({ status: attempt.status }, { status: 409 });
  }

  const { allowed } = await checkRateLimit(`exam:answer:${attemptId}`, { windowSeconds: 10, max: 30 });
  if (!allowed) {
    await prisma.attempt.update({ where: { id: attemptId }, data: { flagged: true } });
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { questionId, selectedOptionId, markedForReview } = parsed.data;

  // The question must actually belong to this attempt's shuffle — blocks a
  // tampered client submitting an answer for a question it was never served.
  const questionOrder = attempt.questionOrder as string[];
  if (!questionOrder.includes(questionId)) {
    return NextResponse.json({ error: "question not in this attempt" }, { status: 400 });
  }

  if (selectedOptionId) {
    const optionOrder = (attempt.optionOrder as Record<string, string[]>)[questionId] ?? [];
    if (!optionOrder.includes(selectedOptionId)) {
      return NextResponse.json({ error: "option not valid for this question" }, { status: 400 });
    }
  }

  // Re-check status immediately before the write — narrows the TOCTOU window
  // between the status check above and the upsert down to two adjacent DB
  // calls with no intervening work, so a concurrent violation-triggered lock
  // (e.g. from a second tab) landing in that gap is caught rather than
  // silently accepted. Not airtight (no row lock), but proportionate: the
  // residual window is tiny, and the impact of losing the race is a user
  // gaming their own practice score, not a money or data-integrity issue.
  const current = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: { status: true },
  });
  if (current.status !== "in_progress") {
    return NextResponse.json({ status: current.status }, { status: 409 });
  }

  await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, selectedOptionId, markedForReview },
    update: { selectedOptionId, markedForReview },
  });

  return NextResponse.json({ ok: true });
}
