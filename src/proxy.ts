import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/adminSession";

// Optimistic checks only (cookie presence, no DB call) — the real,
// DB-backed verification happens in verifySession() on each protected page.
const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/exam", "/history", "/purchases", "/packages"];
const AUTH_ROUTES = ["/login"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // /admin uses a completely separate cookie/session system from students.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasAdminSession = Boolean(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
    if (!hasAdminSession) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
