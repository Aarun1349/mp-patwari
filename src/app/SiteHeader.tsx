"use client";

import Link from "next/link";
import content, { type Lang } from "./landing-content";

export default function SiteHeader({
  lang,
  onToggleLang,
}: {
  lang: Lang;
  onToggleLang: () => void;
}) {
  const t = content[lang];

  return (
    <header>
      <div className="nav wrap">
        <Link href="/" className="brand">
          <div className="seal-mark">ऐ</div>
          <div className="brand-text">
            <div className="en">{t.brandEn}</div>
            <div className="hi">{t.brandHi}</div>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="lang-toggle" onClick={onToggleLang}>
            {lang === "hi" ? "English" : "हिंदी"}
          </button>
          <Link href="/login" className="nav-cta">
            {t.navCta}
          </Link>
        </div>
      </div>
    </header>
  );
}
