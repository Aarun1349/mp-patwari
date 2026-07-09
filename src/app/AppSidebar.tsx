"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/packages", label: "Buy Tests" },
  { href: "/history", label: "Practice History" },
  { href: "/purchases", label: "Purchase History" },
  { href: "/profile", label: "Profile" },
];

export function AppSidebar({ canUpload }: { canUpload: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <Link href="/dashboard" className="app-sidebar-brand">
        <div className="seal-mark">ऐ</div>
        <div className="brand-text">
          <div className="en">ExamsExpress</div>
          <div className="hi">MP पटवारी टेस्ट सीरीज़</div>
        </div>
      </Link>

      <nav className="app-sidebar-nav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`app-sidebar-link${pathname === link.href ? " active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
        {canUpload && (
          <Link href="/upload" className={`app-sidebar-link${pathname === "/upload" ? " active" : ""}`}>
            Upload Questions
          </Link>
        )}
      </nav>

    </aside>
  );
}
