import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashValue } from "@/lib/auth/crypto";

// Deliberately separate from the student SESSION_COOKIE_NAME — an admin and a
// student session can coexist in the same browser without conflict, and this
// keeps admin auth fully independent of the exam-integrity session rules
// (single-device lock, 20-minute idle timeout) that don't apply here.
const ADMIN_SESSION_COOKIE_NAME = "mpp_admin_session";
const ADMIN_SESSION_MAX_AGE_DAYS = 7;

export async function createAdminSession(
  adminUserId: string,
  meta: { ip?: string; userAgent?: string }
): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashValue(token),
      adminUserId,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashValue(token) } });
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

async function loadAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashValue(token) },
    include: { adminUser: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }

  return { adminUserId: session.adminUserId, adminUser: session.adminUser };
}

/** For /admin Server Components/pages — redirects to /admin/login if absent. */
export const verifyAdminSession = cache(async () => {
  const session = await loadAdminSession();
  if (!session) redirect("/admin/login");
  return session;
});

/** For Server Actions under /admin where a redirect-on-failure isn't wanted. */
export const getAdminSession = cache(loadAdminSession);

export { ADMIN_SESSION_COOKIE_NAME };
