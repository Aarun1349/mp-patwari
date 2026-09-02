import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { toggleTenantActiveAction } from "@/app/actions/adminTenants";
import { PLATFORM_TENANT_ID, storefrontUrl } from "@/lib/tenant";
import { StorefrontLink } from "@/components/ui/StorefrontLink";

export default async function AdminTenantsPage() {
  await requirePagePermission(PERMISSIONS.TENANT_ONBOARD);

  const tenants = await prisma.tenant.findMany({
    where: { id: { not: PLATFORM_TENANT_ID } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { papers: true, packages: true, adminUsers: true, enrollments: true } },
    },
  });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Teachers (Tenants)</h1>
      <p className="page-subtitle">
        Onboard a teacher: they get their own storefront page and a login to upload mocks and set
        packages. You control the exam catalog and discounts.
      </p>

      <div className="admin-toolbar">
        <Link href="/admin/tenants/new" className="btn">
          + Onboard a teacher
        </Link>
        <span className="toolbar-note toolbar-spacer">{tenants.length} teacher(s)</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="report-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Storefront</th>
              <th>Share</th>
              <th>Mocks</th>
              <th>Packages</th>
              <th>Logins</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  No teachers onboarded yet. Click “Onboard a teacher” to add your first.
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>
                  {t.name}
                  {t.ownerName && <div style={{ fontSize: "12px", color: "#8a8372" }}>{t.ownerName}</div>}
                </td>
                <td>
                  <StorefrontLink url={storefrontUrl(t.slug)} />
                </td>
                <td>{(t.revenueShareBps / 100).toFixed(0)}%</td>
                <td>{t._count.papers}</td>
                <td>{t._count.packages}</td>
                <td>{t._count.adminUsers}</td>
                <td>
                  <span className={`status-badge ${t.isActive ? "status-good" : "status-neutral"}`}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Link href={`/admin/tenants/${t.id}/payout`} className="btn-sm btn-secondary">
                      Payout
                    </Link>
                    <form action={toggleTenantActiveAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className={`btn-sm ${t.isActive ? "btn-danger" : "btn-secondary"}`}>
                        {t.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
