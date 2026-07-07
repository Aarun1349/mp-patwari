import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeCompareHash(value: string, hash: string): boolean {
  const valueHash = Buffer.from(hashValue(value));
  const target = Buffer.from(hash);
  if (valueHash.length !== target.length) return false;
  return timingSafeEqual(valueHash, target);
}

/** Generic timing-safe string comparison, e.g. for HMAC signature verification. */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
