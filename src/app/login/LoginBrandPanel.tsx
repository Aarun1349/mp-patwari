"use client";

import { useState } from "react";
import { BrandIcon } from "@/components/ui/BrandIcon";

type Lang = "hi" | "en";

const COPY: Record<Lang, {
  brandHi: string;
  headA: string;
  accent: string;
  headB: string;
  sub: string;
  trust: string[];
}> = {
  hi: {
    brandHi: "मॉक टेस्ट सीरीज़",
    headA: "परीक्षा हॉल में ",
    accent: "पहली बार",
    headB: " कंप्यूटर पर टेस्ट मत दीजिए",
    sub: "असली परीक्षा जैसा टाइमर, सेक्शन और स्क्रीन — यहीं अभ्यास करें, तैयार होकर जाएँ।",
    trust: [
      "MPPEB पैटर्न पर आधारित असली परीक्षा जैसा अनुभव",
      "पहला फुल मॉक टेस्ट पूरी तरह मुफ़्त, कोई कार्ड डिटेल नहीं",
      "आपका डेटा सुरक्षित — किसी तीसरे पक्ष के साथ साझा नहीं होता",
    ],
  },
  en: {
    brandHi: "Mock Test Series",
    headA: "Don't sit a computer test for the ",
    accent: "first time",
    headB: " inside the exam hall",
    sub: "A real exam-like timer, sections and screen — practise here and walk in ready.",
    trust: [
      "A real exam experience based on the MPPEB pattern",
      "Your first full mock test is completely free, no card details",
      "Your data stays secure — never shared with any third party",
    ],
  },
};

export function LoginBrandPanel() {
  const [lang, setLang] = useState<Lang>("hi");
  const t = COPY[lang];

  return (
    <div className="login-brand-panel">
      <button
        type="button"
        className="lang-toggle login-lang-toggle"
        onClick={() => setLang((l) => (l === "hi" ? "en" : "hi"))}
      >
        {lang === "hi" ? "English" : "हिंदी"}
      </button>

      <div className="login-brand-mark">
        <BrandIcon size={46} />
        <div>
          <div className="en">ExamsExpress</div>
          <div className="hi">{t.brandHi}</div>
        </div>
      </div>

      <h1>
        {t.headA}
        <span className="accent">{t.accent}</span>
        {t.headB}
      </h1>
      <p>{t.sub}</p>

      <ul className="login-trust-points">
        {t.trust.map((point) => (
          <li key={point}>
            <span className="check">✓</span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
