"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { adminLogin, AdminAuthError } from "@/lib/auth/adminAuth";
import { createAdminSession, destroyAdminSession } from "@/lib/auth/adminSession";

export type AdminAuthActionState = { error?: string } | undefined;

export async function adminLoginAction(
  _prevState: AdminAuthActionState,
  formData: FormData
): Promise<AdminAuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let adminUserId: string;
  try {
    adminUserId = await adminLogin(email, password);
  } catch (err) {
    if (err instanceof AdminAuthError) return { error: err.message };
    console.error("adminLoginAction failed", err);
    return { error: "Something went wrong. Please try again." };
  }

  const headersList = await headers();
  await createAdminSession(adminUserId, {
    ip: headersList.get("x-forwarded-for") ?? undefined,
    userAgent: headersList.get("user-agent") ?? undefined,
  });

  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
