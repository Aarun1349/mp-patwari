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

  const origin = getRequestOrigin(req);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_failed", origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const accessToken = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleProfile(accessToken);

    // First-touch acquisition (QR / pamphlet / ad) captured by proxy.ts — stamped
    // on the account only when resolveGoogleUser creates a brand-new user.
    const userId = await resolveGoogleUser(profile, {
      source: cookieStore.get("acq_source")?.value,
      medium: cookieStore.get("acq_medium")?.value,
      campaign: cookieStore.get("acq_campaign")?.value,
    });

    const headersList = await headers();
    await createSession(userId, {
      ip: headersList.get("x-forwarded-for") ?? undefined,
      userAgent: headersList.get("user-agent") ?? undefined,
    });
  } catch (err) {
    if (err instanceof SessionConflictError) {
      return NextResponse.redirect(new URL("/login?error=session_conflict", origin));
    }
    console.error("Google login failed", err);
    return NextResponse.redirect(new URL("/login?error=google_failed", origin));
  }

  // Attribution is stamped (if new) — clear the first-touch cookies so they
  // can't be reused for a later signup on the same device.
  const res = NextResponse.redirect(new URL("/dashboard", origin));
  res.cookies.delete("acq_source");
  res.cookies.delete("acq_medium");
  res.cookies.delete("acq_campaign");
  return res;
}
