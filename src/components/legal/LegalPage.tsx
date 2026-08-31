"use client";

import { useState, type ReactNode } from "react";
import "../../app/landing.css";
import { type Lang } from "@/app/landing-content";
import SiteHeader from "@/app/SiteHeader";
import SiteFooter from "@/app/SiteFooter";

/**
 * Shared shell for the legal pages (Terms / Privacy / Refund). Reuses the public
 * site chrome (header + footer) so legal pages feel part of the site. Ported from
 * Certur's LegalPage, adapted to ExamsExpress's plain-CSS + landing stack.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <div className="landing">
      <SiteHeader lang={lang} onToggleLang={() => setLang(lang === "hi" ? "en" : "hi")} />
      <section className="legal-hero">
        <div className="wrap">
          <h1>{title}</h1>
          <p className="legal-updated">Last updated: {updated}</p>
        </div>
      </section>
      <main className="legal-body">
        <div className="wrap legal-prose">{children}</div>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="legal-h2">{children}</h2>;
}
export function P({ children }: { children: ReactNode }) {
  return <p className="legal-p">{children}</p>;
}
export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="legal-ul">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
