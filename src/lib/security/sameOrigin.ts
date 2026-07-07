/**
 * Defense-in-depth CSRF check for mutating /api/exam/* routes, on top of the
 * session cookie's sameSite:"lax" flag (which already blocks the realistic
 * cross-site POST/fetch case). Compares the Origin (falling back to Referer)
 * header against the request's own Host header — no separate APP_URL env var
 * needed, and it works unmodified across local dev and any deployed domain.
 */
export function assertSameOrigin(req: Request): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const originHeader = req.headers.get("origin") ?? req.headers.get("referer");
  if (!originHeader) return false;

  try {
    const originHost = new URL(originHeader).host;
    return originHost === host;
  } catch {
    return false;
  }
}
