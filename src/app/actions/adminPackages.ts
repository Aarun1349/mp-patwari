"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";
import { getDefaultExamId } from "@/lib/exam/defaultExam";

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

  const formExamId = String(formData.get("examId") ?? "");
  const examId = formExamId || (await getDefaultExamId());
  await prisma.package.create({ data: { ...parsed.data, examId } });
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

/** Reorder a package one step up/down by swapping sortOrder with its neighbour
 * in the current display order (ties broken by name, same as the listing). */
export async function movePackageAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  const dir = formData.get("dir") === "up" ? "up" : "down";

  const list = await prisma.package.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;

  const a = list[idx];
  const b = list[swapIdx];
  // Swap sortOrder; if the pair is tied, force a distinct value so the order
  // actually changes rather than staying a no-op.
  let aOrder = b.sortOrder;
  let bOrder = a.sortOrder;
  if (aOrder === bOrder) {
    aOrder = dir === "up" ? b.sortOrder - 1 : b.sortOrder + 1;
  }

  await prisma.$transaction([
    prisma.package.update({ where: { id: a.id }, data: { sortOrder: aOrder } }),
    prisma.package.update({ where: { id: b.id }, data: { sortOrder: bOrder } }),
  ]);
  revalidatePath("/admin/packages");
}
