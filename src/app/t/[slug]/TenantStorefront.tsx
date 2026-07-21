"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../../landing.css";
import { type Lang } from "../../landing-content";
import SiteHeader from "../../SiteHeader";
import SiteFooter from "../../SiteFooter";

interface StorefrontPaper {
  id: string;
  title: string;
  isFree: boolean;
  totalQuestions: number;
  durationMinutes: number;
}
interface StorefrontPackage {
  id: string;
  name: string;
  testCount: number;
  pricePaise: number;
  validityDays: number;
}
interface Props {
  tenant: { name: string; ownerName: string | null; tagline: string | null; bio: string | null };
  papers: StorefrontPaper[];
  packages: StorefrontPackage[];
}

const T = {
  hi: {
    eyebrow: "टीचर पेज · ExamsExpress",
    by: "द्वारा",
    ctaPrimary: "फ्री मॉक टेस्ट दें →",
    mocksTitle: "मॉक टेस्ट",
    mocksSub: "इस टीचर के मॉक टेस्ट — असली परीक्षा जैसा इंटरफ़ेस।",
    free: "फ्री",
    paid: "पेड",
    qs: "प्रश्न",
    min: "मिनट",
    take: "टेस्ट दें →",
    packagesTitle: "पैकेज",
    packagesSub: "इस टीचर के टेस्ट पैकेज।",
    tests: "टेस्ट",
    validity: "दिन वैलिडिटी",
    enroll: "लॉगिन करके लें",
    noPackages: "अभी कोई पैकेज उपलब्ध नहीं है।",
    noMocks: "अभी कोई मॉक टेस्ट उपलब्ध नहीं है।",
    disclaimer:
      "ExamsExpress एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म है। ये टेस्ट संबंधित टीचर द्वारा बनाए गए हैं।",
  },
  en: {
    eyebrow: "TEACHER PAGE · ExamsExpress",
    by: "by",
    ctaPrimary: "Take a free mock test →",
    mocksTitle: "Mock Tests",
    mocksSub: "This teacher's mock tests — a real exam-like interface.",
    free: "FREE",
    paid: "PAID",
    qs: "questions",
    min: "min",
    take: "Take test →",
    packagesTitle: "Packages",
    packagesSub: "This teacher's test packages.",
    tests: "tests",
    validity: "-day validity",
    enroll: "Log in to enroll",
    noPackages: "No packages available yet.",
    noMocks: "No mock tests available yet.",
    disclaimer:
      "ExamsExpress is an independent practice platform. These tests are created by the respective teacher.",
  },
} as const;

export default function TenantStorefront({ tenant, papers, packages }: Props) {
  const [lang, setLang] = useState<Lang>("hi");
  const t = T[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const rupees = (paise: number) => `₹${Math.round(paise / 100)}`;

  return (
    <div className="landing">
      <SiteHeader lang={lang} onToggleLang={() => setLang(lang === "hi" ? "en" : "hi")} />

      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{tenant.name}</h1>
          {tenant.ownerName && (
            <p className="lede" style={{ marginBottom: "0.5rem" }}>
              {t.by} {tenant.ownerName}
            </p>
          )}
          {tenant.tagline && <p className="lede">{tenant.tagline}</p>}
          {tenant.bio && <p className="section-sub" style={{ maxWidth: "640px" }}>{tenant.bio}</p>}
          <div className="hero-ctas">
            <Link href="/login" className="btn-primary">
              {t.ctaPrimary}
            </Link>
          </div>
        </div>
      </section>

      <section className="exams-bg">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.mocksTitle}</span>
            <p className="section-sub">{t.mocksSub}</p>
          </div>
          {papers.length === 0 ? (
            <p className="muted">{t.noMocks}</p>
          ) : (
            <div className="exam-grid">
              {papers.map((p) => (
                <Link key={p.id} href="/login" className="exam-card is-live">
                  <div className="exam-card-top">
                    <span className="exam-board">{tenant.name}</span>
                    <span className={`exam-status ${p.isFree ? "live" : "soon"}`}>
                      {p.isFree ? t.free : t.paid}
                    </span>
                  </div>
                  <h3>{p.title}</h3>
                  <span className="exam-cta">
                    {p.totalQuestions} {t.qs} · {p.durationMinutes} {t.min} · {t.take}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pricing-bg">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.packagesTitle}</span>
            <p className="section-sub">{t.packagesSub}</p>
          </div>
          {packages.length === 0 ? (
            <p className="muted">{t.noPackages}</p>
          ) : (
            <div className="price-grid">
              {packages.map((pkg) => (
                <div className="price-card" key={pkg.id}>
                  <div className="name">{pkg.name}</div>
                  <div className="amount">{rupees(pkg.pricePaise)}</div>
                  <div className="per">
                    {pkg.testCount} {t.tests}
                  </div>
                  <ul>
                    <li>
                      {pkg.testCount} {t.tests}
                    </li>
                    <li>
                      {pkg.validityDays}
                      {t.validity}
                    </li>
                  </ul>
                  <Link href="/login" className="price-card-action">
                    {t.enroll}
                  </Link>
                </div>
              ))}
            </div>
          )}
          <p className="muted" style={{ maxWidth: "760px", margin: "1.5rem auto 0", textAlign: "center" }}>
            {t.disclaimer}
          </p>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
