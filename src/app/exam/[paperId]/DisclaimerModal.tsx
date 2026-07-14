"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type Lang } from "../../landing-content";
import content from "../../disclaimer/disclaimer-content";

const NAVY = "#1a2a44";
const GOLD = "#c9a227";
const RED = "#a3242a";

// Section order mirrors /disclaimer so the modal and the full page stay in sync.
const SECTIONS: [titleKey: keyof (typeof content)["en"], bodyKey: keyof (typeof content)["en"]][] = [
  ["notAffiliatedTitle", "notAffiliatedBody"],
  ["noRefundsTitle", "noRefundsBody"],
  ["technicalSupportTitle", "technicalSupportBody"],
  ["contentAccuracyTitle", "contentAccuracyBody"],
  ["contactTitle", "contactBody"],
];

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("hi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  const t = content[lang];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          color: RED,
          textDecoration: "underline",
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
        }}
      >
        Disclaimer &amp; Policies
      </button>

      {mounted && open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.title}
              onClick={close}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 20, 33, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                zIndex: 1000,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  maxWidth: "720px",
                  width: "100%",
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                }}
              >
                <header
                  style={{
                    background: NAVY,
                    borderBottom: `3px solid ${GOLD}`,
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <h2 style={{ fontSize: "16px", color: "#f0e9d8", fontWeight: 700, margin: 0 }}>{t.title}</h2>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      role="group"
                      aria-label="Language"
                      style={{ display: "flex", border: `1px solid ${GOLD}`, borderRadius: "6px", overflow: "hidden" }}
                    >
                      {(["hi", "en"] as Lang[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLang(l)}
                          aria-pressed={lang === l}
                          style={{
                            padding: "5px 12px",
                            fontSize: "13px",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            background: lang === l ? GOLD : "transparent",
                            color: lang === l ? NAVY : "#f0e9d8",
                          }}
                        >
                          {l === "hi" ? "हिं" : "EN"}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f0e9d8",
                        fontSize: "22px",
                        lineHeight: 1,
                        cursor: "pointer",
                        padding: "0 4px",
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </header>

                <div style={{ padding: "20px 24px", overflowY: "auto", color: "#2b2b2b" }}>
                  <p style={{ fontSize: "12px", letterSpacing: "0.05em", textTransform: "uppercase", color: GOLD, margin: "0 0 16px" }}>
                    {t.kicker}
                  </p>
                  {SECTIONS.map(([titleKey, bodyKey]) => (
                    <section key={titleKey} style={{ marginBottom: "18px" }}>
                      <h3 style={{ fontSize: "15px", color: NAVY, margin: "0 0 6px" }}>{t[titleKey]}</h3>
                      <p style={{ margin: 0, lineHeight: 1.6, fontSize: "14px" }}>{t[bodyKey]}</p>
                    </section>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
