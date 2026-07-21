import { prisma } from "@/lib/prisma";
import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { createPackageAction } from "@/app/actions/adminPackages";
import { PackageForm } from "../PackageForm";

export default async function NewPackagePage() {
  await requirePagePermission(PERMISSIONS.PACKAGE_MANAGE_OWN);
  const exams = await prisma.exam.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="auth-card" style={{ maxWidth: "480px" }}>
      <h1>Create Package</h1>
      <PackageForm action={createPackageAction} exams={exams} />
    </div>
  );
}
