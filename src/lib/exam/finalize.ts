import "server-only";
import { prisma } from "@/lib/prisma";
import { scoreAttempt } from "@/lib/exam/scoring";
import type { AttemptStatus } from "@prisma/client";

type TargetStatus = Extract<AttemptStatus, "submitted" | "expired" | "locked">;

export interface FinalizeResult {
  totalScore: number;
  accuracyPct: number;
  status: string;
}

/**
 * The only place that writes totalScore/accuracyPct and flips an attempt to a
 * terminal status. Called from the submit route, the heartbeat self-finalize
 * branch, the violation lock-on-3rd-strike branch, and the reaper.
 *
 * Race-safe: the conditional updateMany only succeeds for whichever caller
 * gets there first (e.g. a heartbeat poll and the reaper noticing the same
 * expired attempt at once) — the loser reads back the already-computed score
 * instead of rescoring.
 */
export async function finalizeAttempt(
  attemptId: string,
  targetStatus: TargetStatus
): Promise<FinalizeResult> {
  const flip = await prisma.attempt.updateMany({
    where: { id: attemptId, status: { in: ["in_progress", "paused"] } },
    data: { status: targetStatus, submittedAt: new Date() },
  });

  if (flip.count === 0) {
    const existing = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
    return {
      totalScore: existing.totalScore ?? 0,
      accuracyPct: existing.accuracyPct ?? 0,
      status: existing.status,
    };
  }

  const attempt = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { answers: true },
  });

  const questions = await prisma.question.findMany({
    where: { paperId: attempt.paperId, isActive: true },
    include: { options: { where: { isCorrect: true }, take: 1 } },
  });

  const scoringQuestions = questions.map((q) => ({
    id: q.id,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    correctOptionId: q.options[0]?.id ?? null,
  }));

  const result = scoreAttempt(scoringQuestions, attempt.answers);

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { totalScore: result.totalScore, accuracyPct: result.accuracyPct },
  });

  return { totalScore: result.totalScore, accuracyPct: result.accuracyPct, status: targetStatus };
}
