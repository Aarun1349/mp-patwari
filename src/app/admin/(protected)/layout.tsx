import type { ReactNode } from "react";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { adminLogoutAction } from "@/app/actions/adminAuth";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

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
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { adminUser } = await verifyAdminSession();
  const links = NAV.filter((n) => n.perm === null || hasPermission(adminUser, n.perm));
  const roleLabel = adminUser.role?.name ?? "";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <div className="seal-mark">ऐ</div>
          <div className="brand-text">
            <div className="en">ExamsExpress</div>
            <div className="hi">{roleLabel || "एडमिन कंट्रोलर"}</div>
          </div>
        </div>
        <nav className="app-sidebar-nav">
          {links.map((n) => (
            <a key={n.href} href={n.href} className="app-sidebar-link">
              {n.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <div className="app-topbar">
          <span>
            {adminUser.email}
            {roleLabel ? ` · ${roleLabel}` : ""}
          </span>
          <form action={adminLogoutAction}>
            <button type="submit" className="logout-btn">
              Log out
            </button>
          </form>
        </div>
        <main className="app-content admin-content">{children}</main>
      </div>
    </div>
  );
}
