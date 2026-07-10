import { createPackageAction } from "@/app/actions/adminPackages";
import { PackageForm } from "../PackageForm";

export default function NewPackagePage() {
  return (
    <div className="auth-card" style={{ maxWidth: "480px" }}>
      <h1>Create Package</h1>
      <PackageForm action={createPackageAction} />
    </div>
  );
}
