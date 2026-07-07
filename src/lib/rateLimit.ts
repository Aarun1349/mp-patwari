import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by a single Postgres table.
 * Reused for OTP send/verify, login, order creation, and exam-engine
 * question-serving/answer anomaly checks — no Redis needed at this scale.
 *
 * Implemented as a single atomic INSERT ... ON CONFLICT statement so
 * concurrent callers can't each read count < max before any of them commits
 * their increment (a prior two-step upsert-then-update version had exactly
 * that race).
 */
export async function checkRateLimit(
  key: string,
  { windowSeconds, max }: { windowSeconds: number; max: number }
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000
  );

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit_counters (key, "windowStart", count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_counters."windowStart" = ${windowStart} THEN rate_limit_counters.count + 1
        ELSE 1
      END,
      "windowStart" = ${windowStart}
    RETURNING count
  `;

  const count = rows[0].count;
  return { allowed: count <= max, remaining: Math.max(0, max - count) };
}
