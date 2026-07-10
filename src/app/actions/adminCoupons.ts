"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";

export type CouponActionState = { error?: string } | undefined;

const CouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3)
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, "code must be letters, numbers, - or _ only"),
    discountType: z.enum(["percent", "flat"]),
    discountValue: z.coerce.number().int().positive(),
    maxRedemptions: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce.number().int().positive().optional()
    ),
    validFrom: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
    validUntil: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
    isActive: z.boolean(),
  })
  .refine((v) => v.discountType !== "percent" || v.discountValue <= 100, {
    message: "percent discount must be 100 or less",
    path: ["discountValue"],
  });

export async function createCouponAction(
  _prevState: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const parsed = CouponSchema.safeParse({
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    maxRedemptions: formData.get("maxRedemptions"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { error: "A coupon with this code already exists." };

  await prisma.coupon.create({ data: parsed.data });
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function toggleCouponActiveAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return;

  await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  revalidatePath("/admin/coupons");
}
