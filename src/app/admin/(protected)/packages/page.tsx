import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { togglePackageActiveAction } from "@/app/actions/adminPackages";

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Packages</h1>
      <p className="muted">
        <Link href="/admin/packages/new">+ Create new package</Link>
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Kind</th>
            <th>Tests</th>
            <th>Price</th>
            <th>Validity</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{pkg.kind}</td>
              <td>{pkg.testCount}</td>
              <td>₹{(pkg.pricePaise / 100).toFixed(2)}</td>
              <td>{pkg.validityDays}d</td>
              <td>{pkg.isActive ? "Yes" : "No"}</td>
              <td>
                <Link href={`/admin/packages/${pkg.id}`}>Edit</Link>
                {" · "}
                <form action={togglePackageActiveAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={pkg.id} />
                  <button type="submit" style={{ fontSize: "12px", padding: "2px 6px" }}>
                    {pkg.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
