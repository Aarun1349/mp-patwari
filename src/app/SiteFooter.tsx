"use client";

import Link from "next/link";
import content, { type Lang } from "./landing-content";

// Generic, exam-agnostic footer — SiteFooter is shared across the Patwari landing,
// MP TET pages, and teacher storefronts, so it must not be Patwari-specific.
const FOOTER = {
  hi: "ExamsExpress — एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म। किसी भी परीक्षा बोर्ड से असंबद्ध।",
  en: "ExamsExpress — an independent practice platform, not affiliated with any exam board.",
} as const;

const LEGAL_LINKS = {
  hi: { terms: "नियम", privacy: "गोपनीयता", refund: "रिफ़ंड" },
  en: { terms: "Terms", privacy: "Privacy", refund: "Refunds" },
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
        <Link href="/legal/terms">{LEGAL_LINKS[lang].terms}</Link>
        <Link href="/legal/privacy">{LEGAL_LINKS[lang].privacy}</Link>
        <Link href="/legal/refund">{LEGAL_LINKS[lang].refund}</Link>
      </div>
    </footer>
  );
}
