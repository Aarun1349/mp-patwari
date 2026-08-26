import "server-only";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateOtpCode, hashValue, safeCompareHash } from "@/lib/auth/crypto";
import { sendOtpSms } from "@/lib/auth/sms";

const OTP_TTL_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export class RateLimitedError extends Error {
  constructor() {
    super("Too many attempts. Please wait a few minutes and try again.");
    this.name = "RateLimitedError";
  }
}

export class InvalidOtpError extends Error {
  constructor(message = "Invalid or expired code.") {
    super(message);
    this.name = "InvalidOtpError";
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function requestOtp(rawPhone: string, ip?: string): Promise<void> {
  const phone = normalizePhone(rawPhone);
  if (phone.length !== 10) {
    throw new InvalidOtpError("Enter a valid 10-digit mobile number.");
  }

  // Per-IP cap FIRST: without it, one attacker rotating through many phone
  // numbers from a single IP would each pass the per-phone limit and burn real
  // SMS money. 20 sends / 15 min per IP is generous for shared NAT yet caps abuse.
  if (ip && ip !== "unknown") {
    const ipCheck = await checkRateLimit(`otp:send:ip:${ip}`, {
      windowSeconds: 15 * 60,
      max: 20,
    });
    if (!ipCheck.allowed) throw new RateLimitedError();
  }

  const { allowed } = await checkRateLimit(`otp:send:${phone}`, {
    windowSeconds: 10 * 60,
    max: 3,
  });
  if (!allowed) throw new RateLimitedError();

  const code = generateOtpCode();
  await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash: hashValue(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendOtpSms(phone, code);
}

export interface SignupAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
}

export async function verifyOtp(
  rawPhone: string,
  code: string,
  attribution?: SignupAttribution,
  ip?: string
): Promise<{ userId: string; isNewUser: boolean }> {
  const phone = normalizePhone(rawPhone);

  // Per-IP cap on verify attempts stops code-guessing that rotates phone numbers
  // to slip under the per-phone limit.
  if (ip && ip !== "unknown") {
    const ipCheck = await checkRateLimit(`otp:verify:ip:${ip}`, {
      windowSeconds: 15 * 60,
      max: 30,
    });
    if (!ipCheck.allowed) throw new RateLimitedError();
  }

  const { allowed } = await checkRateLimit(`otp:verify:${phone}`, {
    windowSeconds: 10 * 60,
    max: 10,
  });
  if (!allowed) throw new RateLimitedError();

  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge || challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new InvalidOtpError();
  }

  if (!safeCompareHash(code, challenge.codeHash)) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw new InvalidOtpError();
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        phone,
        signupSource: attribution?.source ?? null,
        signupMedium: attribution?.medium ?? null,
        signupCampaign: attribution?.campaign ?? null,
      },
    }));

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { userId: user.id, isNewUser: !existingUser };
}
