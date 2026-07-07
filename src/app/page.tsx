"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./landing.css";
import content, { type Lang } from "./landing-content";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="landing">
      <header>
        <div className="nav wrap">
          <div className="brand">
            <div className="seal-mark">ऐ</div>
            <div className="brand-text">
              <div className="en">{t.brandEn}</div>
              <div className="hi">{t.brandHi}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className="lang-toggle" onClick={() => setLang(lang === "hi" ? "en" : "hi")}>
              {lang === "hi" ? "English" : "हिंदी"}
            </button>
            <Link href="/login">
              <button className="nav-cta">{t.navCta}</button>
            </Link>
          </div>
        </div>
      </header>

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
              <Link href="/login">
                <button className="btn-primary">{t.ctaPrimary}</button>
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
            {t.plans.map((plan) => (
              <div className={`price-card${plan.tag ? " popular" : ""}`} key={plan.name}>
                {plan.tag && <div className="tag">{plan.tag}</div>}
                <div className="name">{plan.name}</div>
                <div className="amount">{plan.amount}</div>
                <div className="per">{plan.per}</div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href="/login">
                  <button>{plan.cta}</button>
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
          <Link href="/login">
            <button>{t.finalCta}</button>
          </Link>
        </div>
      </section>

      <footer>
        {t.footer}
        <div className="footer-links">
          <Link href="/about">{t.footerLinks.about}</Link>
          <Link href="/how-it-works">{t.footerLinks.howItWorks}</Link>
          <Link href="/disclaimer">{t.footerLinks.disclaimer}</Link>
        </div>
      </footer>
    </div>
  );
}
