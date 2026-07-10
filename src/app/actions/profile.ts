"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  dateOfBirth: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  category: z.preprocess(emptyToUndefined, z.enum(["GENERAL", "OBC", "SC", "ST", "EWS"]).optional()),
  qualification: z.preprocess(
    emptyToUndefined,
    z.enum(["TENTH", "TWELFTH", "GRADUATE", "POST_GRADUATE", "OTHER"]).optional()
  ),
  examInterest: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),
  // Purely a contact field — never used for login. See schema.prisma's note
  // on User.contactPhone for why this is deliberately not the auth `phone`.
  contactPhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number.")
      .optional()
  ),
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
    dateOfBirth: formData.get("dateOfBirth"),
    city: formData.get("city"),
    category: formData.get("category"),
    qualification: formData.get("qualification"),
    examInterest: formData.get("examInterest"),
    contactPhone: formData.get("contactPhone"),
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
      dateOfBirth: parsed.data.dateOfBirth ?? null,
      city: parsed.data.city ?? null,
      category: parsed.data.category ?? null,
      qualification: parsed.data.qualification ?? null,
      examInterest: parsed.data.examInterest ?? null,
      contactPhone: parsed.data.contactPhone ?? null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}
