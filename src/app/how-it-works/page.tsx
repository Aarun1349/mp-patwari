"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../landing.css";
import { type Lang } from "../landing-content";
import content from "./how-it-works-content";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";

export default function HowItWorksPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="landing">
      <SiteHeader lang={lang} onToggleLang={() => setLang(lang === "hi" ? "en" : "hi")} />

      <section className="ledger-bg">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.kicker}</span>
          </div>
          <div className="static-card">
            <h1>{t.title}</h1>

            <h2>{t.step1Title}</h2>
            <p>{t.step1Desc}</p>

            <h2>{t.step2Title}</h2>
            <p>{t.step2Desc}</p>

            <h2>{t.step3Title}</h2>
            <p>{t.step3Desc}</p>

            <h2>{t.examTitle}</h2>
            <ul>
              {t.examBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <h2>{t.afterTitle}</h2>
            <p>
              {t.afterPre} <Link href="/history">{t.afterLinkText}</Link> {t.afterPost}
            </p>

            <p className="muted">
              {t.disclaimerPre} <Link href="/disclaimer">{t.disclaimerLinkText}</Link>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
