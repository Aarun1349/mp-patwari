"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../landing.css";
import { type Lang } from "../landing-content";
import content from "./about-content";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";

export default function AboutPage() {
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

            <p>{t.intro1}</p>
            <p>{t.intro2}</p>

            <h2>{t.coverTitle}</h2>
            <ul>
              {t.subjects.map((subject) => (
                <li key={subject}>{subject}</li>
              ))}
            </ul>

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
