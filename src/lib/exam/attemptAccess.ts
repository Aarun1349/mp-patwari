import "server-only";
import { prisma } from "@/lib/prisma";

/** Shared ownership check reused by every /api/exam/[attemptId]/* route. */
export async function loadOwnedAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) return null;
  return attempt;
}
