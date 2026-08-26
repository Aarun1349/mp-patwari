import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort client IP, read from the headers Caddy sets in front of the app.
 * Caddy populates `x-real-ip` with the immediate peer and appends it to
 * `x-forwarded-for`; since Caddy is the only ingress, the first hop is the real
 * client. Returns "unknown" when neither header is present — callers should skip
 * per-IP limiting on "unknown" so a missing header can't lump users together.
 * Never throws.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const realIp = h.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  const xff = h.get("x-forwarded-for");
  if (xff && xff.trim()) return xff.split(",")[0].trim();
  return "unknown";
}
