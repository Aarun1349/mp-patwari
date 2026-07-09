"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
});

export type ProfileActionState = { success?: boolean; error?: string } | undefined;

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const { userId } = await verifySession();

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const newEmail = parsed.data.email || null;
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const emailChanged = newEmail !== current?.email;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: newEmail,
      // A self-reported email is unverified until proven via Google OAuth
      // (resolveGoogleUser) — never trust it as an identity-linking anchor.
      ...(emailChanged ? { emailVerified: false } : {}),
    },
  });

  revalidatePath("/profile");
  return { success: true };
}
