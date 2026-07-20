"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../landing.css";
import { type Lang } from "../landing-content";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import type { Block, SeoPage } from "./mptet-content";

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "h2":
      return <h2 key={i}>{block.text}</h2>;
    case "p":
      return <p key={i}>{block.text}</p>;
    case "ul":
      return (
        <ul key={i}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div key={i} style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.55rem 0.75rem",
                      borderBottom: "2px solid currentColor",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderBottom: "1px solid rgba(0,0,0,0.12)",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

// Bilingual static content page for MP TET SEO. The page.tsx server component
// exports the SEO metadata; this island only handles the hi/en toggle so the
// content is still server-rendered (crawlable) on first load.
export default function StaticSeoPage({ content }: { content: Record<Lang, SeoPage> }) {
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
            <p>{t.intro}</p>
            {t.blocks.map(renderBlock)}
            <p className="muted" style={{ marginTop: "1.5rem" }}>
              <Link href="/mp-tet-varg-2">← MP TET वर्ग 2 / Varg 2</Link>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  );
}
