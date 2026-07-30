"use client";

import Link from "next/link";
import content, { type Lang } from "./landing-content";

// Generic, exam-agnostic footer — SiteFooter is shared across the Patwari landing,
// MP TET pages, and teacher storefronts, so it must not be Patwari-specific.
const FOOTER = {
  hi: "ExamsExpress — एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म। किसी भी परीक्षा बोर्ड से असंबद्ध।",
  en: "ExamsExpress — an independent practice platform, not affiliated with any exam board.",
} as const;

export default function SiteFooter({ lang }: { lang: Lang }) {
  const t = content[lang];

  return (
    <footer>
      {FOOTER[lang]}
      <div className="footer-links">
        <Link href="/about">{t.footerLinks.about}</Link>
        <Link href="/how-it-works">{t.footerLinks.howItWorks}</Link>
        <Link href="/disclaimer">{t.footerLinks.disclaimer}</Link>
      </div>
    </footer>
  );
}
