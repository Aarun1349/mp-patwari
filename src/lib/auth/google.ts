import "server-only";
import { prisma } from "@/lib/prisma";

export const GOOGLE_STATE_COOKIE_NAME = "google_oauth_state";

export class GoogleAuthError extends Error {}

/** Derives this request's own origin — same no-new-env-var approach as assertSameOrigin. */
export function getRequestOrigin(req: Request): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/** Plain fetch to Google's OAuth endpoints — no vendor SDK, matches this codebase's Razorpay/MSG91 pattern. */
export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new GoogleAuthError("Google login is not configured.");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new GoogleAuthError("Google login is not configured.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GoogleAuthError(`Google token exchange failed (${res.status}): ${body}`);
  }

  const data: { access_token?: string } = await res.json();
  if (!data.access_token) throw new GoogleAuthError("Google token exchange returned no access token.");
  return data.access_token;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GoogleAuthError(`Google userinfo fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Resolves a Google profile to a User row: match by googleId, else link onto
 * an existing user with the same verified email (preserves credits/attempts
 * for someone who signed up by phone first), else create a new user.
 *
 * The email-fallback match is gated on the target row's own `emailVerified`
 * flag, not just Google's claim about the incoming profile — `User.email` can
 * be set to an arbitrary, unverified address via the profile form, so trusting
 * it here would let an attacker pre-plant a victim's email on their own
 * account and hijack the victim's first Google sign-in.
 */
export interface SignupAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
}

export async function resolveGoogleUser(
  profile: GoogleProfile,
  attribution?: SignupAttribution
): Promise<string> {
  if (!profile.sub) throw new GoogleAuthError("Google profile missing subject id.");

  const byGoogleId = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  if (byGoogleId) return byGoogleId.id;

  if (profile.email && profile.email_verified) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: profile.email, mode: "insensitive" }, emailVerified: true },
    });
    if (byEmail) {
      await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: profile.sub } });
      return byEmail.id;
    }
  }

  const created = await prisma.user.create({
    data: {
      googleId: profile.sub,
      email: profile.email,
      emailVerified: Boolean(profile.email && profile.email_verified),
      name: profile.name,
      signupSource: attribution?.source ?? null,
      signupMedium: attribution?.medium ?? null,
      signupCampaign: attribution?.campaign ?? null,
    },
  });
  return created.id;
}
