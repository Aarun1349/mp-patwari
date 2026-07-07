import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, SessionConflictError } from "@/lib/auth/session";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  getRequestOrigin,
  resolveGoogleUser,
  GOOGLE_STATE_COOKIE_NAME,
} from "@/lib/auth/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE_NAME)?.value;
  cookieStore.delete(GOOGLE_STATE_COOKIE_NAME);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }

  try {
    const redirectUri = `${getRequestOrigin(req)}/api/auth/google/callback`;
    const accessToken = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleProfile(accessToken);
    const userId = await resolveGoogleUser(profile);

    const headersList = await headers();
    await createSession(userId, {
      ip: headersList.get("x-forwarded-for") ?? undefined,
      userAgent: headersList.get("user-agent") ?? undefined,
    });
  } catch (err) {
    if (err instanceof SessionConflictError) {
      return NextResponse.redirect(new URL("/login?error=session_conflict", req.url));
    }
    console.error("Google login failed", err);
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
