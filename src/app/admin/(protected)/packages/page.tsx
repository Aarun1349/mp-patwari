import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { togglePackageActiveAction, movePackageAction } from "@/app/actions/adminPackages";

export default async function AdminPackagesPage() {
  await verifyAdminSession();
  const packages = await prisma.package.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Packages</h1>
      <p className="page-subtitle">Pricing tiers shown on the landing page and /packages. Reorder with the arrows.</p>

      <div className="admin-toolbar">
        <Link href="/admin/packages/new" className="btn">
          + Create package
        </Link>
        <span className="toolbar-note toolbar-spacer">{packages.length} package(s)</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="report-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Kind</th>
              <th>Tests</th>
              <th>Price</th>
              <th>Per test</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, i) => {
              const perTest = pkg.testCount > 0 ? pkg.pricePaise / 100 / pkg.testCount : 0;
              return (
                <tr key={pkg.id}>
                  <td>
                    <span style={{ display: "inline-flex", gap: "4px" }}>
                      <form action={movePackageAction}>
                        <input type="hidden" name="id" value={pkg.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" className="btn-sm btn-secondary" disabled={i === 0} aria-label="Move up">
                          ↑
                        </button>
                      </form>
                      <form action={movePackageAction}>
                        <input type="hidden" name="id" value={pkg.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button
                          type="submit"
                          className="btn-sm btn-secondary"
                          disabled={i === packages.length - 1}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </form>
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#1a2a44" }}>{pkg.name}</td>
                  <td>{pkg.kind}</td>
                  <td>{pkg.testCount}</td>
                  <td>₹{(pkg.pricePaise / 100).toLocaleString("en-IN")}</td>
                  <td style={{ color: "#8a8372" }}>₹{perTest.toFixed(0)}</td>
                  <td>{pkg.validityDays}d</td>
                  <td>
                    <span className={`status-badge ${pkg.isActive ? "status-good" : "status-neutral"}`}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <Link href={`/admin/packages/${pkg.id}`}>Edit</Link>
                      <form action={togglePackageActiveAction}>
                        <input type="hidden" name="id" value={pkg.id} />
                        <button type="submit" className={`btn-sm ${pkg.isActive ? "btn-danger" : "btn-secondary"}`}>
                          {pkg.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
