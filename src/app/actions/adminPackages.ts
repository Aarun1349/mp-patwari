"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";

export type PackageActionState = { error?: string } | undefined;

const PackageSchema = z.object({
  name: z.string().trim().min(1),
  testCount: z.coerce.number().int().positive(),
  pricePaise: z.coerce.number().int().nonnegative(),
  kind: z.enum(["standard", "topup"]),
  validityDays: z.coerce.number().int().positive(),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

export async function createPackageAction(
  _prevState: PackageActionState,
  formData: FormData
): Promise<PackageActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const parsed = PackageSchema.safeParse({
    name: formData.get("name"),
    testCount: formData.get("testCount"),
    pricePaise: formData.get("pricePaise"),
    kind: formData.get("kind"),
    validityDays: formData.get("validityDays"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.package.create({ data: parsed.data });
  revalidatePath("/admin/packages");
  redirect("/admin/packages");
}

export async function updatePackageAction(
  _prevState: PackageActionState,
  formData: FormData
): Promise<PackageActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing package id." };

  const parsed = PackageSchema.safeParse({
    name: formData.get("name"),
    testCount: formData.get("testCount"),
    pricePaise: formData.get("pricePaise"),
    kind: formData.get("kind"),
    validityDays: formData.get("validityDays"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.package.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/packages");
  redirect("/admin/packages");
}

export async function togglePackageActiveAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return;

  await prisma.package.update({ where: { id }, data: { isActive: !pkg.isActive } });
  revalidatePath("/admin/packages");
}
