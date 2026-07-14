"use client";

import { useState } from "react";
import Link from "next/link";
import { type Lang } from "./landing-content";
import { InfoModal } from "./InfoModal";
import aboutContent from "./about/about-content";
import howContent from "./how-it-works/how-it-works-content";
import disclaimerContent from "./disclaimer/disclaimer-content";

type ModalKey = "about" | "how" | "disclaimer";

// Section order mirrors the /disclaimer page so the modal stays in sync.
const DISCLAIMER_SECTIONS: [titleKey: keyof (typeof disclaimerContent)["en"], bodyKey: keyof (typeof disclaimerContent)["en"]][] = [
  ["notAffiliatedTitle", "notAffiliatedBody"],
  ["noRefundsTitle", "noRefundsBody"],
  ["technicalSupportTitle", "technicalSupportBody"],
  ["contentAccuracyTitle", "contentAccuracyBody"],
  ["contactTitle", "contactBody"],
];

export function AppInfoLinks() {
  const [open, setOpen] = useState<ModalKey | null>(null);
  const [lang, setLang] = useState<Lang>("hi");

  const title =
    open === "about"
      ? aboutContent[lang].title
      : open === "how"
        ? howContent[lang].title
        : open === "disclaimer"
          ? disclaimerContent[lang].title
          : "";

  return (
    <div className="footer-links">
      <button type="button" className="footer-link-btn" onClick={() => setOpen("about")}>
        About
      </button>
      <button type="button" className="footer-link-btn" onClick={() => setOpen("how")}>
        How It Works
      </button>
      <button type="button" className="footer-link-btn" onClick={() => setOpen("disclaimer")}>
        Disclaimer &amp; Policies
      </button>

      {open && (
        <InfoModal title={title} lang={lang} onLang={setLang} onClose={() => setOpen(null)}>
          {open === "about" && <AboutBody lang={lang} onOpenDisclaimer={() => setOpen("disclaimer")} />}
          {open === "how" && (
            <HowBody lang={lang} onOpenDisclaimer={() => setOpen("disclaimer")} onClose={() => setOpen(null)} />
          )}
          {open === "disclaimer" && <DisclaimerBody lang={lang} />}
        </InfoModal>
      )}
    </div>
  );
}

function AboutBody({ lang, onOpenDisclaimer }: { lang: Lang; onOpenDisclaimer: () => void }) {
  const t = aboutContent[lang];
  return (
    <>
      <p className="imodal-kicker">{t.kicker}</p>
      <p>{t.intro1}</p>
      <p>{t.intro2}</p>
      <h3>{t.coverTitle}</h3>
      <ul>
        {t.subjects.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="imodal-note">
        {t.disclaimerPre}{" "}
        <button type="button" className="imodal-inline-link" onClick={onOpenDisclaimer}>
          {t.disclaimerLinkText}
        </button>
      </p>
    </>
  );
}

function HowBody({
  lang,
  onOpenDisclaimer,
  onClose,
}: {
  lang: Lang;
  onOpenDisclaimer: () => void;
  onClose: () => void;
}) {
  const t = howContent[lang];
  return (
    <>
      <p className="imodal-kicker">{t.kicker}</p>
      <h3>{t.step1Title}</h3>
      <p>{t.step1Desc}</p>
      <h3>{t.step2Title}</h3>
      <p>{t.step2Desc}</p>
      <h3>{t.step3Title}</h3>
      <p>{t.step3Desc}</p>
      <h3>{t.examTitle}</h3>
      <ul>
        {t.examBullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <h3>{t.afterTitle}</h3>
      <p>
        {t.afterPre}{" "}
        <Link href="/history" className="imodal-inline-link" onClick={onClose}>
          {t.afterLinkText}
        </Link>{" "}
        {t.afterPost}
      </p>
      <p className="imodal-note">
        {t.disclaimerPre}{" "}
        <button type="button" className="imodal-inline-link" onClick={onOpenDisclaimer}>
          {t.disclaimerLinkText}
        </button>
      </p>
    </>
  );
}

function DisclaimerBody({ lang }: { lang: Lang }) {
  const t = disclaimerContent[lang];
  return (
    <>
      <p className="imodal-kicker">{t.kicker}</p>
      {DISCLAIMER_SECTIONS.map(([titleKey, bodyKey]) => (
        <section key={titleKey}>
          <h3>{t[titleKey]}</h3>
          <p>{t[bodyKey]}</p>
        </section>
      ))}
    </>
  );
}
