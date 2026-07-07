import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateSessionToken } from "@/lib/auth/crypto";
import { buildGoogleAuthUrl, getRequestOrigin, GoogleAuthError, GOOGLE_STATE_COOKIE_NAME } from "@/lib/auth/google";

export async function GET(req: Request) {
  const state = generateSessionToken();
  const redirectUri = `${getRequestOrigin(req)}/api/auth/google/callback`;

  let authUrl: string;
  try {
    authUrl = buildGoogleAuthUrl(state, redirectUri);
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
    }
    throw err;
  }

  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(authUrl);
}
