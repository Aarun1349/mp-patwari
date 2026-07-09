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
          <a href="/admin/upload" className="app-sidebar-link">
            Upload Questions
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
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
