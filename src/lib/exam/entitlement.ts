import "server-only";
import { prisma } from "@/lib/prisma";
import { shuffleAttempt } from "@/lib/exam/shuffle";

export const MAX_ATTEMPTS_PER_PAPER = 5;
const NON_TERMINAL_STATUSES = ["in_progress", "paused"] as const;
const TERMINAL_STATUSES = ["submitted", "expired", "locked"] as const;

export class NoEntitlementError extends Error {
  constructor() {
    super("You don't have any tests remaining. Purchase a package to continue.");
    this.name = "NoEntitlementError";
  }
}

export class MaxAttemptsReachedError extends Error {
  constructor() {
    super(`You've used all ${MAX_ATTEMPTS_PER_PAPER} attempts for this test.`);
    this.name = "MaxAttemptsReachedError";
  }
}

export class PaperUnavailableError extends Error {
  constructor() {
    super("This test is not currently available.");
    this.name = "PaperUnavailableError";
  }
}

export interface PaperAttemptSummary {
  resumableAttemptId: string | null;
  terminalAttemptCount: number;
  maxAttempts: number;
  latestTerminalAttemptId: string | null;
}

/** Used by dashboard/history to decide whether to show Start / Resume / Retake / maxed-out. */
export async function getPaperAttemptSummary(
  userId: string,
  paperId: string
): Promise<PaperAttemptSummary> {
  const attempts = await prisma.attempt.findMany({
    where: { userId, paperId },
    select: { id: true, status: true, startedAt: true },
    orderBy: { startedAt: "desc" },
  });

  const resumable = attempts.find((a) => (NON_TERMINAL_STATUSES as readonly string[]).includes(a.status));
  const terminal = attempts.filter((a) => (TERMINAL_STATUSES as readonly string[]).includes(a.status));

  return {
    resumableAttemptId: resumable?.id ?? null,
    terminalAttemptCount: terminal.length,
    maxAttempts: MAX_ATTEMPTS_PER_PAPER,
    latestTerminalAttemptId: terminal[0]?.id ?? null,
  };
}

/**
 * Entitlement check, atomic credit decrement, shuffle generation, and Attempt
 * creation, all in one transaction. Paid-credit decrement uses a conditional
 * updateMany (WHERE testsRemaining > 0) so concurrent start requests can never
 * take credits below 0.
 *
 * Up to MAX_ATTEMPTS_PER_PAPER terminal (submitted/expired/locked) attempts
 * are allowed per paper; an existing in-progress/paused attempt is resumed
 * rather than starting a new one. The terminal-count check is a
 * read-then-write inside the transaction, not a DB constraint like the old
 * @@unique — a rare race could let a user squeeze in one extra attempt, which
 * is an acceptable soft limit (unlike the credit decrement above, which stays
 * strictly atomic since real money is at stake there).
 */
export async function startAttempt(userId: string, paperId: string): Promise<{ attemptId: string }> {
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper || !paper.isActive) throw new PaperUnavailableError();

  const summary = await getPaperAttemptSummary(userId, paperId);
  if (summary.resumableAttemptId) {
    return { attemptId: summary.resumableAttemptId };
  }
  if (summary.terminalAttemptCount >= MAX_ATTEMPTS_PER_PAPER) {
    throw new MaxAttemptsReachedError();
  }

  return await prisma.$transaction(async (tx) => {
    if (!paper.isFree) {
      const credit = await tx.userCredit.updateMany({
        where: { userId, testsRemaining: { gt: 0 } },
        data: { testsRemaining: { decrement: 1 } },
      });
      if (credit.count === 0) throw new NoEntitlementError();
    }

    const [questions, sections] = await Promise.all([
      tx.question.findMany({
        where: { paperId, isActive: true },
        include: { options: true },
      }),
      tx.section.findMany({ select: { id: true, sortOrder: true } }),
    ]);
    const sectionSortOrder = Object.fromEntries(sections.map((s) => [s.id, s.sortOrder]));

    const { questionOrder, optionOrder } = shuffleAttempt(questions, sectionSortOrder);

    const attempt = await tx.attempt.create({
      data: {
        userId,
        paperId,
        endsAt: new Date(Date.now() + paper.durationMinutes * 60_000),
        questionOrder,
        optionOrder,
      },
    });

    return { attemptId: attempt.id };
  });
}
