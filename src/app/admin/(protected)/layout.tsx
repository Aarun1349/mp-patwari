import type { ReactNode } from "react";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { adminLogoutAction } from "@/app/actions/adminAuth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { adminUser } = await verifyAdminSession();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <div className="seal-mark">ऐ</div>
          <div className="brand-text">
            <div className="en">ExamsExpress</div>
            <div className="hi">एडमिन कंट्रोलर</div>
          </div>
        </div>
        <nav className="app-sidebar-nav">
          <a href="/admin" className="app-sidebar-link">
            Dashboard
          </a>
          <a href="/admin/exams" className="app-sidebar-link">
            Exams
          </a>
          <a href="/admin/users" className="app-sidebar-link">
            Users
          </a>
          <a href="/admin/papers" className="app-sidebar-link">
            Papers &amp; Questions
          </a>
          <a href="/admin/upload" className="app-sidebar-link">
            Upload Questions
          </a>
          <a href="/admin/packages" className="app-sidebar-link">
            Packages
          </a>
          <a href="/admin/coupons" className="app-sidebar-link">
            Coupons
          </a>
          <a href="/admin/payouts" className="app-sidebar-link">
            Payouts
          </a>
          <a href="/admin/acquisition" className="app-sidebar-link">
            Acquisition
          </a>
          <a href="/admin/orders" className="app-sidebar-link">
            Orders &amp; Revenue
          </a>
          <a href="/admin/attempts" className="app-sidebar-link">
            Attempts
          </a>
        </nav>
      </aside>
      <div className="app-main">
        <div className="app-topbar">
          <span>{adminUser.email}</span>
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
