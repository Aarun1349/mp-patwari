"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requestOtp, verifyOtp, RateLimitedError, InvalidOtpError } from "@/lib/auth/otp";
import { createSession, destroySession, SessionConflictError } from "@/lib/auth/session";

export type AuthActionState = { success?: boolean; error?: string } | undefined;

export async function requestOtpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const phone = String(formData.get("phone") ?? "");

  try {
    await requestOtp(phone);
    return { success: true };
  } catch (err) {
    if (err instanceof RateLimitedError || err instanceof InvalidOtpError) {
      return { error: err.message };
    }
    console.error("requestOtpAction failed", err);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function verifyOtpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "");

  let userId: string;
  try {
    const result = await verifyOtp(phone, code);
    userId = result.userId;
  } catch (err) {
    if (err instanceof RateLimitedError || err instanceof InvalidOtpError) {
      return { error: err.message };
    }
    console.error("verifyOtpAction failed", err);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    const headersList = await headers();
    await createSession(userId, {
      ip: headersList.get("x-forwarded-for") ?? undefined,
      userAgent: headersList.get("user-agent") ?? undefined,
    });
  } catch (err) {
    if (err instanceof SessionConflictError) {
      return {
        error:
          "This account is already logged in on another device. Please log out there first.",
      };
    }
    console.error("createSession failed", err);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
