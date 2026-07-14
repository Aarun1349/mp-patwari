import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/adminSession";

// Optimistic checks only (cookie presence, no DB call) — the real,
// DB-backed verification happens in verifySession() on each protected page.
const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/exam", "/history", "/purchases", "/packages"];
const AUTH_ROUTES = ["/login"];

const ACQ_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * First-touch acquisition capture: if the entry link carries a utm_source (from
 * a QR on a notebook/pamphlet, a Meta/YT ad, etc.), stash source/medium/campaign
 * in cookies so verifyOtpAction can stamp them on the account at signup. First
 * touch wins — we don't overwrite an existing acq_source.
 */
function captureAcquisition(req: NextRequest, res: NextResponse) {
  const source = req.nextUrl.searchParams.get("utm_source");
  if (!source || req.cookies.get("acq_source")?.value) return;

  const opts = { path: "/", maxAge: ACQ_COOKIE_MAX_AGE, sameSite: "lax" as const };
  res.cookies.set("acq_source", source.slice(0, 60), opts);
  const medium = req.nextUrl.searchParams.get("utm_medium");
  const campaign = req.nextUrl.searchParams.get("utm_campaign");
  if (medium) res.cookies.set("acq_medium", medium.slice(0, 60), opts);
  if (campaign) res.cookies.set("acq_campaign", campaign.slice(0, 60), opts);
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  let res: NextResponse;
  if (isProtected && !hasSession) {
    res = NextResponse.redirect(new URL("/login", req.nextUrl));
  } else if (isAuthRoute && hasSession) {
    res = NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  } else if (
    // /admin uses a completely separate cookie/session system from students.
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  ) {
    res = NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  } else {
    res = NextResponse.next();
  }

  captureAcquisition(req, res);
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
