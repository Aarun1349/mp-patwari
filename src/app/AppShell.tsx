"use client";

import { type ReactNode, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { AppSidebar } from "./AppSidebar";
import { AppFooter } from "./AppFooter";

export function AppShell({
  userLabel,
  children,
}: {
  userLabel: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = (userLabel || "U").trim().charAt(0).toUpperCase();

  // `admin-shell` reuses the shared purple frame CSS (sidebar / topbar / off-canvas
  // drawer); `student-shell` scopes the student content reskin.
  return (
    <div className="app-shell admin-shell student-shell">
      <button
        type="button"
        className="admin-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {mobileOpen && <div className="admin-backdrop" onClick={() => setMobileOpen(false)} />}

      <AppSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <div className="app-main">
        <div className="app-topbar">
          <div className="admin-user-chip">
            <span className="admin-avatar">{initial}</span>
            <span className="admin-user-meta">
              <span className="admin-user-email">{userLabel}</span>
            </span>
          </div>
          <form action={logoutAction}>
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
        <AppFooter />
      </div>
    </div>
  );
}
