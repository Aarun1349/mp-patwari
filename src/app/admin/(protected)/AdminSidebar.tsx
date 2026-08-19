"use client";

// Admin sidebar: brand, nav with icons + active state, and a collapse toggle.
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";

/** A line-icon wrapper — inherits currentColor so it follows the theme. */
function I({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  "/admin": (
    <I>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </I>
  ),
  "/admin/exams": (
    <I>
      <path d="M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" />
    </I>
  ),
  "/admin/tenants": (
    <I>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </I>
  ),
  "/admin/users": (
    <I>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </I>
  ),
  "/admin/papers": (
    <I>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </I>
  ),
  "/admin/upload": (
    <I>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </I>
  ),
  "/admin/packages": (
    <I>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </I>
  ),
  "/admin/earnings": (
    <I>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </I>
  ),
  "/admin/coupons": (
    <I>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </I>
  ),
  "/admin/payouts": (
    <I>
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </I>
  ),
  "/admin/billing": (
    <I>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /><line x1="12" y1="12" x2="12" y2="18" />
    </I>
  ),
  "/admin/acquisition": (
    <I>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </I>
  ),
  "/admin/orders": (
    <I>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </I>
  ),
  "/admin/attempts": (
    <I>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </I>
  ),
};

function DefaultIcon() {
  return (
    <I>
      <circle cx="12" cy="12" r="9" />
    </I>
  );
}

export function AdminSidebar({
  links,
  roleLabel,
}: {
  links: { href: string; label: string }[];
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("ee-admin-sidebar-collapsed") === "1") {
      setCollapsed(true);
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("ee-admin-sidebar-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  // On the mobile drawer, always show labels even if the desktop state is collapsed.
  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      {/* Hidden while the drawer is open so it never covers the drawer's EE logo. */}
      {!mobileOpen && (
        <button
          type="button"
          className="admin-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {mobileOpen && <div className="admin-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`app-sidebar${collapsed ? " app-sidebar--collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
        <div className="app-sidebar-inner">
          <div className="app-sidebar-brand">
            <div className="app-sidebar-brand-link">
              <BrandIcon size={34} />
              {showLabels && (
                <div className="brand-text">
                  <div className="en">ExamsExpress</div>
                  <div className="hi">{roleLabel || "Admin"}</div>
                </div>
              )}
            </div>
            {/* Mobile-only close button (desktop uses the collapse toggle below). */}
            <button
              type="button"
              className="app-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="app-sidebar-nav">
            {links.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={`app-sidebar-link${isActive(n.href) ? " active" : ""}`}
                title={collapsed ? n.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon">{ICONS[n.href] ?? <DefaultIcon />}</span>
                {showLabels && <span className="nav-label">{n.label}</span>}
              </a>
            ))}
          </nav>

          <div className="app-sidebar-foot">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {collapsed ? (
                  <>
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                  </>
                ) : (
                  <>
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                  </>
                )}
              </svg>
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
