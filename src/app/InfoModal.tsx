"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type Lang } from "./landing-content";
import "./info-modal.css";

export function InfoModal({
  title,
  lang,
  onLang,
  onClose,
  children,
}: {
  title: string;
  lang: Lang;
  onLang: (l: Lang) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="imodal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="imodal-card" onClick={(e) => e.stopPropagation()}>
        <header className="imodal-head">
          <h2>{title}</h2>
          <div className="imodal-controls">
            <div className="imodal-lang" role="group" aria-label="Language">
              {(["hi", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLang(l)}
                  aria-pressed={lang === l}
                  className={lang === l ? "active" : ""}
                >
                  {l === "hi" ? "हिं" : "EN"}
                </button>
              ))}
            </div>
            <button type="button" className="imodal-close" aria-label="Close" onClick={onClose}>
              &times;
            </button>
          </div>
        </header>
        <div className="imodal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
