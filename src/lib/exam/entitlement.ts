import "server-only";
import { prisma } from "@/lib/prisma";
import { shuffleAttempt } from "@/lib/exam/shuffle";

export class NoEntitlementError extends Error {
  constructor() {
    super("You don't have any tests remaining. Purchase a package to continue.");
    this.name = "NoEntitlementError";
  }
}

export class AlreadyAttemptedError extends Error {
  constructor() {
    super("You've already attempted this test.");
    this.name = "AlreadyAttemptedError";
  }
}

export class PaperUnavailableError extends Error {
  constructor() {
    super("This test is not currently available.");
    this.name = "PaperUnavailableError";
  }
}

function isUniqueConstraintViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

/**
 * Entitlement check, atomic credit decrement, shuffle generation, and Attempt
 * creation, all in one transaction. Paid-credit decrement uses a conditional
 * updateMany (WHERE testsRemaining > 0) so concurrent start requests can never
 * take credits below 0. The Attempt.@@unique([userId, paperId]) constraint
 * converts a duplicate-attempt race into a caught unique violation here,
 * rolling back any credit decrement so a failed duplicate never costs a credit.
 */
export async function startAttempt(userId: string, paperId: string): Promise<{ attemptId: string }> {
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper || !paper.isActive) throw new PaperUnavailableError();

  try {
    return await prisma.$transaction(async (tx) => {
      if (!paper.isFree) {
        const credit = await tx.userCredit.updateMany({
          where: { userId, testsRemaining: { gt: 0 } },
          data: { testsRemaining: { decrement: 1 } },
        });
        if (credit.count === 0) throw new NoEntitlementError();
      }

      const questions = await tx.question.findMany({
        where: { paperId, isActive: true },
        include: { options: true },
      });

      const { questionOrder, optionOrder } = shuffleAttempt(questions);

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
  } catch (err) {
    if (isUniqueConstraintViolation(err)) throw new AlreadyAttemptedError();
    throw err;
  }
}
