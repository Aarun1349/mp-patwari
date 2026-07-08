"use client";

import { useEffect, useState } from "react";
import "../landing.css";
import { type Lang } from "../landing-content";
import content from "./disclaimer-content";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";

export default function DisclaimerPage() {
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

            <h2>{t.notAffiliatedTitle}</h2>
            <p>{t.notAffiliatedBody}</p>

            <h2>{t.noRefundsTitle}</h2>
            <p>{t.noRefundsBody}</p>

            <h2>{t.technicalSupportTitle}</h2>
            <p>{t.technicalSupportBody}</p>

            <h2>{t.contentAccuracyTitle}</h2>
            <p>{t.contentAccuracyBody}</p>

            <h2>{t.contactTitle}</h2>
            <p>{t.contactBody}</p>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
