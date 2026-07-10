import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePackageAction } from "@/app/actions/adminPackages";
import { PackageForm } from "../PackageForm";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) notFound();

  return (
    <div className="auth-card" style={{ maxWidth: "480px" }}>
      <h1>Edit Package</h1>
      <PackageForm action={updatePackageAction} defaults={pkg} />
    </div>
  );
}
