import type { ReactNode } from "react";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { adminLogoutAction } from "@/app/actions/adminAuth";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AdminSidebar } from "./AdminSidebar";

// Each link declares the permission that reveals it. `perm: null` = always shown.
const NAV: { href: string; label: string; perm: string | null }[] = [
  { href: "/admin", label: "Dashboard", perm: null },
  { href: "/admin/exams", label: "Exams", perm: PERMISSIONS.EXAM_MANAGE },
  { href: "/admin/tenants", label: "Teachers", perm: PERMISSIONS.TENANT_ONBOARD },
  { href: "/admin/users", label: "Users", perm: PERMISSIONS.STUDENT_READ },
  { href: "/admin/papers", label: "Papers & Questions", perm: PERMISSIONS.QUESTION_MANAGE_OWN },
  { href: "/admin/upload", label: "Upload Questions", perm: PERMISSIONS.QUESTION_MANAGE_OWN },
  { href: "/admin/packages", label: "Packages", perm: PERMISSIONS.PACKAGE_MANAGE_OWN },
  { href: "/admin/earnings", label: "Earnings", perm: PERMISSIONS.REVENUE_READ_OWN },
  { href: "/admin/coupons", label: "Coupons", perm: PERMISSIONS.COUPON_MANAGE },
  { href: "/admin/payouts", label: "Payouts", perm: PERMISSIONS.PAYOUT_READ },
  { href: "/admin/billing", label: "GST & Billing", perm: PERMISSIONS.ORDER_READ },
  { href: "/admin/acquisition", label: "Acquisition", perm: PERMISSIONS.STUDENT_READ },
  { href: "/admin/orders", label: "Orders & Revenue", perm: PERMISSIONS.ORDER_READ },
  { href: "/admin/attempts", label: "Attempts", perm: PERMISSIONS.ORDER_READ },
  { href: "/admin/activity", label: "Activity", perm: PERMISSIONS.AUDIT_READ },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { adminUser } = await verifyAdminSession();
  const links = NAV.filter((n) => n.perm === null || hasPermission(adminUser, n.perm));
  const roleLabel = adminUser.role?.name ?? "";

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar links={links} roleLabel={roleLabel} />
      <div className="app-main">
        <div className="app-topbar">
          <div className="admin-user-chip">
            <span className="admin-avatar">{(adminUser.name ?? adminUser.email ?? "A").charAt(0).toUpperCase()}</span>
            <span className="admin-user-meta">
              <span className="admin-user-email">{adminUser.email}</span>
              {roleLabel && <span className="admin-user-role">{roleLabel}</span>}
            </span>
          </div>
          <form action={adminLogoutAction}>
            <button type="submit" className="logout-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </form>
        </div>
        <main className="app-content admin-content">{children}</main>
      </div>
    </div>
  );
}
