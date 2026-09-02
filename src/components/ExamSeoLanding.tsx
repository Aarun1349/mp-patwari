"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/app/landing.css";
import { type Lang } from "@/app/landing-content";
import SiteHeader from "@/app/SiteHeader";
import SiteFooter from "@/app/SiteFooter";

// Generic, content-driven SEO landing for an exam. Data comes in as props so one
// component serves MP SI, MP TET (future migration), and any new exam. Mirrors the
// original MP TET landing's design vocabulary (hero + admit card + cards + pattern
// + why + FAQ + final CTA).
export interface ExamLandingContent {
  eyebrow: string;
  heroTitlePre: string;
  heroTitleAccent: string;
  heroTitlePost: string;
  lede: string;
  ctaPrimary: string;
  ctaGhost: string;
  stats: { value: string; label: string }[];
  admitCard: {
    t1: string;
    t2: string;
    name: string;
    role: string;
    rows: { label: string; value: string }[];
    stamp: string;
  };
  subjectsKicker: string;
  subjectsTitle: string;
  subjectsSub: string;
  subjects: { name: string; live: boolean }[];
  liveBadge: string;
  soonBadge: string;
  startCta: string;
  patternKicker: string;
  patternTitle: string;
  patternSubjectHeader: string;
  patternWeightHeader: string;
  patternRows: { subject: string; weight: string }[];
  patternBig: string;
  patternNote: string;
  whyKicker: string;
  whyTitle: string;
  whyCards: { icon: string; title: string; desc: string }[];
  faqKicker: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  finalTitle: string;
  finalDesc: string;
  finalCta: string;
  disclaimer: string;
}

export default function ExamSeoLanding({
  landing,
  examBoardLabel,
  admitTag,
  syllabusHref,
  startHref = "/login",
}: {
  landing: Record<Lang, ExamLandingContent>;
  examBoardLabel: string;
  admitTag: string;
  syllabusHref?: string;
  startHref?: string;
}) {
  const [lang, setLang] = useState<Lang>("hi");
  const t = landing[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="landing">
      <SiteHeader lang={lang} onToggleLang={() => setLang(lang === "hi" ? "en" : "hi")} />

      {/* Hero */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>
              {t.heroTitlePre}
              <span className="accent">{t.heroTitleAccent}</span>
              {t.heroTitlePost}
            </h1>
            <p className="lede">{t.lede}</p>
            <div className="hero-ctas">
              <Link href={startHref} className="btn-primary">
                {t.ctaPrimary}
              </Link>
              <a href="#pattern" className="btn-ghost">
                {t.ctaGhost}
              </a>
            </div>
            <div className="hero-stats">
              {t.stats.map((s) => (
                <div key={s.label}>
                  {s.value}
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admit-card">
            <div className="ac-head">
              <div>
                <div className="t1">{t.admitCard.t1}</div>
                <div className="t2">{t.admitCard.t2}</div>
              </div>
              <div className="mono" style={{ fontSize: "11px" }}>
                {admitTag}
              </div>
            </div>
            <div className="ac-body">
              <div className="ac-topline">
                <div className="ac-photo" />
                <div className="who">
                  <div className="name">{t.admitCard.name}</div>
                  <div className="role">{t.admitCard.role}</div>
                </div>
              </div>
              {t.admitCard.rows.map((row) => (
                <div className="ac-row" key={row.label}>
                  <span className="label">{row.label}</span>
                  <span className="value">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="ac-stamp">{t.admitCard.stamp}</div>
          </div>
        </div>
      </section>

      {/* Subjects / mocks */}
      <section className="exams-bg" id="subjects">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.subjectsKicker}</span>
            <h2>{t.subjectsTitle}</h2>
            <p className="section-sub">{t.subjectsSub}</p>
          </div>
          <div className="exam-grid">
            {t.subjects.map((subject) => {
              const card = (
                <>
                  <div className="exam-card-top">
                    <span className="exam-board">{examBoardLabel}</span>
                    <span className={`exam-status ${subject.live ? "live" : "soon"}`}>
                      {subject.live ? t.liveBadge : t.soonBadge}
                    </span>
                  </div>
                  <h3>{subject.name}</h3>
                  <span className="exam-cta">{subject.live ? t.startCta : t.soonBadge}</span>
                </>
              );
              return subject.live ? (
                <Link key={subject.name} href={startHref} className="exam-card is-live">
                  {card}
                </Link>
              ) : (
                <div key={subject.name} className="exam-card is-soon" aria-disabled>
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exam pattern */}
      <section id="pattern">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.patternKicker}</span>
            <h2>{t.patternTitle}</h2>
          </div>
          <div className="pattern-wrap">
            <table className="pattern">
              <thead>
                <tr>
                  <th>{t.patternSubjectHeader}</th>
                  <th>{t.patternWeightHeader}</th>
                </tr>
              </thead>
              <tbody>
                {t.patternRows.map((row) => (
                  <tr key={row.subject}>
                    <td>{row.subject}</td>
                    <td>{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pattern-note">
              <div className="big">{t.patternBig}</div>
              <p>{t.patternNote}</p>
              {syllabusHref && (
                <p style={{ marginTop: "0.75rem" }}>
                  <Link href={syllabusHref}>{lang === "hi" ? "पूरा सिलेबस देखें →" : "View full syllabus →"}</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="ledger-bg">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.whyKicker}</span>
            <h2>{t.whyTitle}</h2>
          </div>
          <div className="why-grid">
            {t.whyCards.map((card) => (
              <div className="why-card" key={card.title}>
                <div className="icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.faqKicker}</span>
            <h2>{t.faqTitle}</h2>
          </div>
          <div className="faq-list">
            {t.faqs.map((faq, i) => (
              <details className="faq-item" key={faq.q} open={i === 0}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="muted" style={{ maxWidth: "760px", margin: "1.5rem auto 0", textAlign: "center" }}>
            {t.disclaimer}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="wrap" style={{ padding: 0 }}>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalDesc}</p>
          <Link href={startHref} className="final-cta-action">
            {t.finalCta}
          </Link>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
