"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";

function I({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const NAV_LINKS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <I>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </I>
    ),
  },
  {
    href: "/teachers",
    label: "Teachers",
    icon: (
      <I>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      </I>
    ),
  },
  {
    href: "/packages",
    label: "Buy Tests",
    icon: (
      <I>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </I>
    ),
  },
  {
    href: "/history",
    label: "Practice History",
    icon: (
      <I>
        <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" />
      </I>
    ),
  },
  {
    href: "/purchases",
    label: "Purchase History",
    icon: (
      <I>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </I>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <I>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </I>
    ),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("ee-app-sidebar-collapsed") === "1") {
      setCollapsed(true);
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("ee-app-sidebar-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

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
            <Link href="/dashboard" className="app-sidebar-brand-link" onClick={() => setMobileOpen(false)}>
              <BrandIcon size={34} />
              {showLabels && (
                <div className="brand-text">
                  <div className="en">ExamsExpress</div>
                  <div className="hi">मॉक टेस्ट सीरीज़</div>
                </div>
              )}
            </Link>
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? link.label : undefined}
                className={`app-sidebar-link${pathname === link.href ? " active" : ""}`}
              >
                <span className="nav-icon">{link.icon}</span>
                {showLabels && <span className="nav-label">{link.label}</span>}
              </Link>
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
