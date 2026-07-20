"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../landing.css";
import { type Lang } from "../landing-content";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { mptetLanding } from "./mptet-content";

export default function MpTetLandingClient() {
  const [lang, setLang] = useState<Lang>("hi");
  const t = mptetLanding[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="landing">
      <SiteHeader lang={lang} onToggleLang={() => setLang(lang === "hi" ? "en" : "hi")} />

      {/* Hero */}
      <section className="ledger-bg">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.eyebrow}</span>
          </div>
          <div className="static-card">
            <h1>{t.h1}</h1>
            <p>{t.lede}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.25rem" }}>
              <Link href="/login" className="nav-cta">
                {t.ctaPrimary}
              </Link>
              <Link href="/mp-tet-varg-2/exam-pattern" className="lang-toggle">
                {t.ctaPattern}
              </Link>
              <Link href="/mp-tet-varg-2/syllabus" className="lang-toggle">
                {t.ctaSyllabus}
              </Link>
            </div>
          </div>

          {/* Highlights */}
          <div className="static-card" style={{ marginTop: "1.25rem" }}>
            <h2>{t.highlightsTitle}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "0.75rem",
                marginTop: "0.75rem",
              }}
            >
              {t.highlights.map((h) => (
                <div
                  key={h.k}
                  style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: "10px",
                    padding: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{h.v}</div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    {h.k}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="static-card" style={{ marginTop: "1.25rem" }}>
            <h2>{t.subjectsTitle}</h2>
            <p>{t.subjectsLede}</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.6rem",
                marginTop: "0.75rem",
              }}
            >
              {t.subjects.map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: "10px",
                    padding: "0.7rem 0.9rem",
                    opacity: s.live ? 1 : 0.6,
                  }}
                >
                  <span>{s.name}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "999px",
                      border: "1px solid currentColor",
                    }}
                  >
                    {s.live ? t.liveBadge : t.soonBadge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="static-card" style={{ marginTop: "1.25rem" }}>
            <h2>{t.faqTitle}</h2>
            {t.faqs.map((f) => (
              <div key={f.q} style={{ marginTop: "0.9rem" }}>
                <h2 style={{ fontSize: "1.05rem" }}>{f.q}</h2>
                <p>{f.a}</p>
              </div>
            ))}
            <p className="muted" style={{ marginTop: "1.25rem" }}>
              {t.disclaimer}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
