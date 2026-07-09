import "server-only";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyPassword } from "@/lib/auth/password";

export class AdminAuthError extends Error {}

export async function adminLogin(email: string, password: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  const { allowed } = await checkRateLimit(`admin:login:${normalizedEmail}`, {
    windowSeconds: 10 * 60,
    max: 8,
  });
  if (!allowed) throw new AdminAuthError("Too many attempts. Please wait a few minutes and try again.");

  const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new AdminAuthError("Invalid email or password.");
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  return admin.id;
}
