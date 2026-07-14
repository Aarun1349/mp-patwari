import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashValue } from "@/lib/auth/crypto";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Terminal redirect for expired/invalid student sessions.
 *
 * verifySession() runs during React Server Component render, where Next.js
 * forbids cookie mutation — so it cannot clear the stale `mpp_session` cookie
 * itself. If it redirected straight to /login, proxy.ts would see the stale
 * cookie, treat the user as authenticated, and bounce /login -> /dashboard,
 * which redirects back here: an infinite 307 loop (ERR_TOO_MANY_REDIRECTS).
 *
 * This route lives under /api/* (excluded from proxy.ts's matcher), so it is
 * the one place that can clear the cookie on the way to /login and break the
 * loop.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    // Best-effort DB cleanup; loadSession() has usually already removed it.
    await prisma.session
      .deleteMany({ where: { tokenHash: hashValue(token) } })
      .catch(() => {});
  }

  const res = NextResponse.redirect(new URL("/login", req.nextUrl));
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
