import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/adminSession";

/** The /admin home shown to tenant-scoped roles (partner/creator) instead of the
 * platform analytics dashboard — scoped entirely to their own tenant. */
export async function PartnerHome() {
  const session = await getAdminSession();
  const tenantId = session?.adminUser.tenantId ?? null;

  const [tenant, paperCount, packageCount] = await Promise.all([
    tenantId ? prisma.tenant.findUnique({ where: { id: tenantId } }) : Promise.resolve(null),
    tenantId ? prisma.paper.count({ where: { tenantId } }) : Promise.resolve(0),
    tenantId ? prisma.package.count({ where: { tenantId } }) : Promise.resolve(0),
  ]);

  return (
    <div className="auth-card auth-card-wide">
      <h1>{tenant?.name ?? "Your dashboard"}</h1>
      <p className="page-subtitle">
        Welcome{session?.adminUser.name ? `, ${session.adminUser.name}` : ""}. Manage your own mock
        tests and packages here — you only see and control your own content.
      </p>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-label">Your mock tests</div>
          <div className="stat-value">{paperCount}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Your packages</div>
          <div className="stat-value">{packageCount}</div>
        </div>
      </div>

      <div className="admin-toolbar" style={{ marginTop: "1.25rem", gap: "8px", flexWrap: "wrap" }}>
        <Link href="/admin/papers" className="btn">
          Papers &amp; Questions
        </Link>
        <Link href="/admin/upload" className="btn">
          Upload Questions
        </Link>
        <Link href="/admin/packages" className="btn">
          Packages
        </Link>
        {tenant?.slug && (
          <Link href={`/t/${tenant.slug}`} className="btn btn-secondary" target="_blank">
            View my public page ↗
          </Link>
        )}
      </div>
    </div>
  );
}
