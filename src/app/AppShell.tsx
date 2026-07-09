import type { ReactNode } from "react";
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
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="app-main">
        <div className="app-topbar">
          <span>{userLabel}</span>
          <form action={logoutAction}>
            <button type="submit" className="logout-btn">
              Log out
            </button>
          </form>
        </div>
        <main className="app-content">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
