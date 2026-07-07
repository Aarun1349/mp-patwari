import "server-only";
import { prisma } from "@/lib/prisma";
import { finalizeAttempt } from "@/lib/exam/finalize";

/**
 * Backstop for abandoned attempts (device closed/killed/offline, nothing
 * polling). While a tab is open, the heartbeat route self-finalizes expired
 * attempts within one heartbeat interval — this only matters for the rest.
 *
 * Safe under horizontal scaling: finalizeAttempt's conditional update means
 * multiple replicas sweeping the same row is harmless, just redundant.
 */
export async function sweepExpiredAttempts(): Promise<void> {
  const stale = await prisma.attempt.findMany({
    where: { status: { in: ["in_progress", "paused"] }, endsAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });

  for (const { id } of stale) {
    try {
      await finalizeAttempt(id, "expired");
    } catch (err) {
      console.error(`reaper: failed to finalize attempt ${id}`, err);
    }
  }
}

let started = false;

/** Guarded against dev Fast Refresh re-invoking register() multiple times. */
export function startReaper(intervalMs = 30_000): void {
  if (started) return;
  started = true;

  const handle = setInterval(() => {
    sweepExpiredAttempts().catch((err) => console.error("reaper sweep failed", err));
  }, intervalMs);

  handle.unref?.();
}
