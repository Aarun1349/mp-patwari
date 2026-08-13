"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultExamId } from "@/lib/exam/defaultExam";
import { checkPermission, canActOnTenant, actorTenantId, PERMISSIONS } from "@/lib/auth/permissions";

export type PackageActionState = { error?: string } | undefined;

const NOT_YOURS = "That package belongs to another tenant.";

const PackageSchema = z.object({
  name: z.string().trim().min(1),
  testCount: z.coerce.number().int().positive(),
  // Admin enters the price in RUPEES (intuitive); we store paise. Two decimals
  // are allowed (e.g. 399 → ₹399 → 39900 paise). Previously this field took raw
  // paise, so "599" saved as ₹5.99 — the fix is to convert ×100 here.
  priceRupees: z.coerce.number().nonnegative(),
  kind: z.enum(["standard", "topup"]),
  validityDays: z.coerce.number().int().positive(),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

export async function createPackageAction(
  _prevState: PackageActionState,
  formData: FormData
): Promise<PackageActionState> {
  const gate = await checkPermission(PERMISSIONS.PACKAGE_MANAGE_OWN);
  if ("error" in gate) return gate;

  const parsed = PackageSchema.safeParse({
    name: formData.get("name"),
    testCount: formData.get("testCount"),
    priceRupees: formData.get("priceRupees"),
    kind: formData.get("kind"),
    validityDays: formData.get("validityDays"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { priceRupees, ...rest } = parsed.data;
  const pricePaise = Math.round(priceRupees * 100);
  const formExamId = String(formData.get("examId") ?? "");
  const examId = formExamId || (await getDefaultExamId());
  await prisma.package.create({ data: { ...rest, pricePaise, examId, tenantId: actorTenantId(gate) } });
  revalidatePath("/admin/packages");
  redirect("/admin/packages");
}

export async function updatePackageAction(
  _prevState: PackageActionState,
  formData: FormData
): Promise<PackageActionState> {
  const gate = await checkPermission(PERMISSIONS.PACKAGE_MANAGE_OWN);
  if ("error" in gate) return gate;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing package id." };

  const existing = await prisma.package.findUnique({ where: { id }, select: { tenantId: true } });
  if (!existing) return { error: "Package not found." };
  if (!canActOnTenant(gate, existing.tenantId)) return { error: NOT_YOURS };

  const parsed = PackageSchema.safeParse({
    name: formData.get("name"),
    testCount: formData.get("testCount"),
    priceRupees: formData.get("priceRupees"),
    kind: formData.get("kind"),
    validityDays: formData.get("validityDays"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { priceRupees, ...rest } = parsed.data;
  const pricePaise = Math.round(priceRupees * 100);
  await prisma.package.update({ where: { id }, data: { ...rest, pricePaise } });
  revalidatePath("/admin/packages");
  redirect("/admin/packages");
}

export async function togglePackageActiveAction(formData: FormData): Promise<void> {
  const gate = await checkPermission(PERMISSIONS.PACKAGE_MANAGE_OWN);
  if ("error" in gate) return;

  const id = String(formData.get("id") ?? "");
  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg || !canActOnTenant(gate, pkg.tenantId)) return;

  await prisma.package.update({ where: { id }, data: { isActive: !pkg.isActive } });
  revalidatePath("/admin/packages");
}

/** Reorder a package one step up/down by swapping sortOrder with its neighbour
 * in the current display order (ties broken by name, same as the listing).
 * Reordering happens within the actor's own tenant scope. */
export async function movePackageAction(formData: FormData): Promise<void> {
  const gate = await checkPermission(PERMISSIONS.PACKAGE_MANAGE_OWN);
  if ("error" in gate) return;

  const id = String(formData.get("id") ?? "");
  const dir = formData.get("dir") === "up" ? "up" : "down";

  // Tenant-scoped actors reorder only within their own packages; platform actors
  // see the full list.
  const where = gate.adminUser.role?.scope === "platform" ? {} : { tenantId: actorTenantId(gate) };
  const list = await prisma.package.findMany({ where, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
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
