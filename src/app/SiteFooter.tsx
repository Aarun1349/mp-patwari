"use client";

import Link from "next/link";
import content, { type Lang } from "./landing-content";

export default function SiteFooter({ lang }: { lang: Lang }) {
  const t = content[lang];

  return (
    <footer>
      {t.footer}
      <div className="footer-links">
        <Link href="/about">{t.footerLinks.about}</Link>
        <Link href="/how-it-works">{t.footerLinks.howItWorks}</Link>
        <Link href="/disclaimer">{t.footerLinks.disclaimer}</Link>
      </div>
    </footer>
  );
}
