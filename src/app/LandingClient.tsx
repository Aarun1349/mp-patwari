"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./landing.css";
import content, { type Lang } from "./landing-content";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/** Minimal package shape the landing needs — the source of truth is the DB,
 * fetched server-side in page.tsx so the landing can never drift from /packages. */
export interface LandingPackage {
  id: string;
  name: string;
  pricePaise: number;
  testCount: number;
  validityDays: number;
}

/** An exam shown in the landing's exam selector. `live` = has an active paper. */
export interface LandingExam {
  id: string;
  name: string;
  slug: string;
  board: string | null;
  live: boolean;
}

const EXAM_LABELS = {
  hi: {
    kicker: "परीक्षाएँ",
    title: "अपनी परीक्षा चुनें",
    subtitle: "MP राज्य स्तरीय परीक्षाओं की असली इंटरफ़ेस पर तैयारी — और परीक्षाएँ जल्द आ रही हैं।",
    live: "लाइव",
    soon: "जल्द आ रहा है",
    start: "फ्री टेस्ट दें →",
  },
  en: {
    kicker: "EXAMS",
    title: "Choose your exam",
    subtitle: "Practice for MP state-level exams on the real interface — more exams coming soon.",
    live: "Live",
    soon: "Coming soon",
    start: "Take free test →",
  },
} as const;

interface PricingCard {
  key: string;
  name: string;
  amount: string;
  per: string;
  features: string[];
  cta: string;
  tag?: string;
}

// Hindi display names for known tiers; falls back to the raw (English) name.
const NAME_HI: Record<string, string> = {
  Single: "सिंगल टेस्ट",
  Starter: "स्टार्टर",
  Value: "वैल्यू",
  Popular: "पॉपुलर",
  Pro: "प्रो",
};

function buildPricingCards(lang: Lang, packages: LandingPackage[], freeCta: string): PricingCard[] {
  const hi = lang === "hi";

  // The free mock isn't a DB package — it's granted to every account.
  const freeCard: PricingCard = {
    key: "free",
    name: hi ? "फ्री ट्रायल" : "Free Trial",
    amount: "₹0",
    per: hi ? "1 फुल टेस्ट" : "1 full test",
    features: hi
      ? ["असली परीक्षा इंटरफ़ेस", "इंस्टेंट स्कोरकार्ड", "कोई कार्ड डिटेल नहीं"]
      : ["Real exam interface", "Instant scorecard", "No card required"],
    cta: freeCta,
  };

  const paidCards: PricingCard[] = packages.map((pkg) => {
    const rupees = Math.round(pkg.pricePaise / 100);
    const isPopular = pkg.name.toLowerCase() === "popular";
    return {
      key: pkg.id,
      name: hi ? (NAME_HI[pkg.name] ?? pkg.name) : pkg.name,
      amount: `₹${rupees}`,
      per: hi
        ? `${pkg.testCount} टेस्ट`
        : `${pkg.testCount} test${pkg.testCount === 1 ? "" : "s"}`,
      features: hi
        ? [
            `${pkg.testCount} फुल-लेंथ मॉक टेस्ट`,
            "हर टेस्ट के बाद सेक्शन-वाइज़ एनालिसिस",
            `${pkg.validityDays} दिन वैलिडिटी`,
          ]
        : [
            `${pkg.testCount} full-length mock test${pkg.testCount === 1 ? "" : "s"}`,
            "Section-wise analysis after each test",
            `${pkg.validityDays}-day validity`,
          ],
      cta: hi ? "पैकेज लें" : "Get Package",
      tag: isPopular ? (hi ? "सबसे लोकप्रिय" : "MOST POPULAR") : undefined,
    };
  });

  return [freeCard, ...paidCards];
}

export function LandingClient({ packages, exams }: { packages: LandingPackage[]; exams: LandingExam[] }) {
  const [lang, setLang] = useState<Lang>("hi");
  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const pricingCards = buildPricingCards(lang, packages, t.plans[0]?.cta ?? (lang === "hi" ? "अभी शुरू करें" : "Start Now"));

  return (
    <div className="landing">
      <SiteHeader lang={lang} onToggleLang={() => setLang(lang === "hi" ? "en" : "hi")} />

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>
              {t.heroTitlePre}
              <span className="accent">{t.heroTitleAccent}</span>
              {t.heroTitlePost}
            </h1>
            <p className="lede">{t.heroLede}</p>
            <div className="hero-ctas">
              <Link href="/login" className="btn-primary">
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
                #MP-PTW
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

      <section className="exams-bg" id="exams">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{EXAM_LABELS[lang].kicker}</span>
            <h2>{EXAM_LABELS[lang].title}</h2>
            <p className="section-sub">{EXAM_LABELS[lang].subtitle}</p>
          </div>
          <div className="exam-grid">
            {exams.map((exam) => {
              const el = EXAM_LABELS[lang];
              const card = (
                <>
                  <div className="exam-card-top">
                    <span className="exam-board">{exam.board ?? "MPESB"}</span>
                    <span className={`exam-status ${exam.live ? "live" : "soon"}`}>
                      {exam.live ? el.live : el.soon}
                    </span>
                  </div>
                  <h3>{exam.name}</h3>
                  <span className="exam-cta">{exam.live ? el.start : el.soon}</span>
                </>
              );
              return exam.live ? (
                <Link key={exam.id} href="/login" className="exam-card is-live">
                  {card}
                </Link>
              ) : (
                <div key={exam.id} className="exam-card is-soon" aria-disabled>
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ledger-bg">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.stepsKicker}</span>
            <h2>{t.stepsTitle}</h2>
          </div>
          <div className="steps">
            {t.steps.map((step) => (
              <div className="step" key={step.num}>
                <div className="num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            </div>
          </div>
        </div>
      </section>

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

      <section className="pricing-bg" id="pricing">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">{t.pricingKicker}</span>
            <h2>{t.pricingTitle}</h2>
          </div>
          <div className="price-grid">
            {pricingCards.map((plan) => (
              <div className={`price-card${plan.tag ? " popular" : ""}`} key={plan.key}>
                {plan.tag && <div className="tag">{plan.tag}</div>}
                <div className="name">{plan.name}</div>
                <div className="amount">{plan.amount}</div>
                <div className="per">{plan.per}</div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href="/login" className="price-card-action">
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

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
        </div>
      </section>

      <section className="final-cta">
        <div className="wrap" style={{ padding: 0 }}>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalDesc}</p>
          <Link href="/login" className="final-cta-action">
            {t.finalCta}
          </Link>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
