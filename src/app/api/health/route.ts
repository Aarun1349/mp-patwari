import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liveness + readiness probe for uptime monitors (BetterStack / UptimeRobot).
// Returns 200 only when the app can actually reach Postgres — a server that
// answers HTTP but can't query the DB is still "down" for users, and a plain
// homepage ping would miss that. No auth, no secrets, never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "up", latencyMs: Date.now() - startedAt },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    // Don't leak the DB error text to the public probe.
    return NextResponse.json(
      { status: "error", db: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
