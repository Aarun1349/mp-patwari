import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePackageAction } from "@/app/actions/adminPackages";
import { requirePagePermission, canActOnTenant, PERMISSIONS } from "@/lib/auth/permissions";
import { PackageForm } from "../PackageForm";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  const session = await requirePagePermission(PERMISSIONS.PACKAGE_MANAGE_OWN);
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || !canActOnTenant(session, pkg.tenantId)) notFound();

  return (
    <div className="auth-card" style={{ maxWidth: "480px" }}>
      <h1>Edit Package</h1>
      <PackageForm action={updatePackageAction} defaults={pkg} />
    </div>
  );
}
