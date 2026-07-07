"use server";

import { verifySession } from "@/lib/auth/session";
import {
  startAttempt,
  NoEntitlementError,
  AlreadyAttemptedError,
  PaperUnavailableError,
} from "@/lib/exam/entitlement";

export type StartAttemptResult = { attemptId: string } | { error: string };

export async function startAttemptAction(paperId: string): Promise<StartAttemptResult> {
  const { userId } = await verifySession();

  try {
    const { attemptId } = await startAttempt(userId, paperId);
    return { attemptId };
  } catch (err) {
    if (
      err instanceof NoEntitlementError ||
      err instanceof AlreadyAttemptedError ||
      err instanceof PaperUnavailableError
    ) {
      return { error: err.message };
    }
    console.error("startAttemptAction failed", err);
    return { error: "Something went wrong. Please try again." };
  }
}
