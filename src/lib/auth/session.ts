import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashValue } from "@/lib/auth/crypto";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "mpp_session";
const IDLE_TIMEOUT_MINUTES = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? 20);
const SESSION_MAX_AGE_DAYS = 7;

export class SessionConflictError extends Error {
  constructor() {
    super("Already logged in on another device.");
    this.name = "SessionConflictError";
  }
}

/**
 * Enforces one active session per account. A session counts as "active" if it
 * was seen within the idle window; stale sessions are cleared rather than
 * silently extended, so a crashed/abandoned device can't lock a user out forever.
 *
 * Split from createSession() so the DB decision logic can be exercised outside
 * of a Next.js request scope (e.g. in a script), since cookies() cannot be.
 */
export async function createSessionRecord(
  userId: string,
  meta: { ip?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const idleThreshold = new Date(Date.now() - IDLE_TIMEOUT_MINUTES * 60 * 1000);

  const activeSession = await prisma.session.findFirst({
    where: { userId, lastSeenAt: { gt: idleThreshold } },
  });

  if (activeSession) {
    throw new SessionConflictError();
  }

  // Clear any stale (idle-expired) sessions for this user before issuing a new one.
  await prisma.session.deleteMany({ where: { userId } });

  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashValue(token),
      userId,
      lastSeenAt: now,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  return { token, expiresAt };
}

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const { token, expiresAt } = await createSessionRecord(userId, meta);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashValue(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Shared cookie/DB/idle-expiry lookup used by both verifySession() (redirects,
 * for pages) and getApiSession() (returns null, for JSON API routes).
 */
async function loadSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const idleThreshold = new Date(Date.now() - IDLE_TIMEOUT_MINUTES * 60 * 1000);
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashValue(token) },
    include: { user: true },
  });

  if (!session || session.lastSeenAt < idleThreshold || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  // Sliding expiry: any authenticated activity resets the idle clock. Throttled
  // to once/minute rather than every request — this app polls frequently (exam
  // heartbeat every 15s), and a once-a-minute write is far more than precise
  // enough against a 20-minute idle timeout, so this avoids a lot of pointless
  // writes for no loss of accuracy.
  const SLIDING_UPDATE_THROTTLE_MS = 60_000;
  if (Date.now() - session.lastSeenAt.getTime() > SLIDING_UPDATE_THROTTLE_MS) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return { userId: session.userId, user: session.user };
}

/**
 * Data Access Layer session check — verifies the session against the DB (not
 * just the cookie), applies the sliding 20-minute idle expiry, and redirects
 * unauthenticated users. Memoized per-request with React's cache(). Use in
 * Server Components / Server Actions / pages.
 */
export const verifySession = cache(async () => {
  const session = await loadSession();
  if (!session) redirect("/login");
  return session;
});

/**
 * Same check as verifySession(), but returns null instead of redirecting.
 * Use in Route Handlers under /api/* — that path is excluded from proxy.ts's
 * matcher, and a JSON API must never 307-redirect to an HTML login page.
 */
export const getApiSession = cache(loadSession);

/** Optimistic, cookie-only check for use in proxy.ts — no DB round trip. */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export { SESSION_COOKIE_NAME };
