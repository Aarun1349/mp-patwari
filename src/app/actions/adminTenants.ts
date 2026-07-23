"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";

export type TenantActionState = { error?: string } | undefined;

const optional = (max: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(max).optional());

const TenantSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers and hyphens"),
    ownerName: optional(80),
    tagline: optional(160),
    bio: optional(600),
    revenueSharePct: z.coerce.number().int().min(0).max(100),
    loginEmail: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().trim().toLowerCase().email().optional()
    ),
    loginPassword: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(10).optional()),
  })
  .refine((d) => !d.loginEmail || !!d.loginPassword, {
    message: "A login password (10+ chars) is required to create the teacher's login.",
    path: ["loginPassword"],
  });

export async function createTenantAction(
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const gate = await checkPermission(PERMISSIONS.TENANT_ONBOARD);
  if ("error" in gate) return gate;

  const parsed = TenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    ownerName: formData.get("ownerName"),
    tagline: formData.get("tagline"),
    bio: formData.get("bio"),
    revenueSharePct: formData.get("revenueSharePct"),
    loginEmail: formData.get("loginEmail"),
    loginPassword: formData.get("loginPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  if (d.slug === PLATFORM_TENANT_ID) return { error: 'The slug "platform" is reserved.' };
  if (await prisma.tenant.findUnique({ where: { slug: d.slug } })) {
    return { error: "A tenant with this slug already exists." };
  }

  if (d.loginEmail) {
    if (await prisma.adminUser.findUnique({ where: { email: d.loginEmail } })) {
      return { error: "That login email is already in use." };
    }
    const partnerRole = await prisma.role.findUnique({ where: { key: "partner" } });
    if (!partnerRole) return { error: "Partner role not found — run the database seed first." };

    // Tenant + partner login together.
    const tenant = await prisma.tenant.create({
      data: {
        name: d.name,
        slug: d.slug,
        ownerName: d.ownerName ?? null,
        tagline: d.tagline ?? null,
        bio: d.bio ?? null,
        revenueShareBps: d.revenueSharePct * 100,
        approved: true,
        isActive: true,
        onboardedBy: gate.adminUser.email ?? "admin",
      },
    });
    await prisma.adminUser.create({
      data: {
        email: d.loginEmail,
        passwordHash: await hashPassword(d.loginPassword!),
        name: d.ownerName ?? d.name,
        roleId: partnerRole.id,
        tenantId: tenant.id,
      },
    });
  } else {
    await prisma.tenant.create({
      data: {
        name: d.name,
        slug: d.slug,
        ownerName: d.ownerName ?? null,
        tagline: d.tagline ?? null,
        bio: d.bio ?? null,
        revenueShareBps: d.revenueSharePct * 100,
        approved: true,
        isActive: true,
        onboardedBy: gate.adminUser.email ?? "admin",
      },
    });
  }

  revalidatePath("/admin/tenants");
  redirect("/admin/tenants");
}

export async function toggleTenantActiveAction(formData: FormData): Promise<void> {
  const gate = await checkPermission(PERMISSIONS.TENANT_ONBOARD);
  if ("error" in gate) return;

  const id = String(formData.get("id") ?? "");
  if (id === PLATFORM_TENANT_ID) return; // never disable the platform tenant
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return;

  await prisma.tenant.update({ where: { id }, data: { isActive: !tenant.isActive } });
  revalidatePath("/admin/tenants");
}
