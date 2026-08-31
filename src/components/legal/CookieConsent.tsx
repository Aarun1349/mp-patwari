"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "ee_cookie_consent";

/**
 * Lightweight cookie banner. Essential cookies (auth/security) always run;
 * non-essential (e.g. analytics) would only run after "Accept all". The choice
 * is stored per-browser. Ported from Certur, adapted to plain CSS. Privacy-
 * preserving default: nothing non-essential until the user opts in.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  const choose = (value: "accepted" | "essential") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-inner">
        <p className="cookie-text">
          We use essential cookies to keep you signed in and secure. With your consent we may use non-essential cookies
          to improve ExamsExpress. See our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </p>
        <div className="cookie-actions">
          <button type="button" className="cookie-btn cookie-btn--ghost" onClick={() => choose("essential")}>
            Essential only
          </button>
          <button type="button" className="cookie-btn cookie-btn--accept" onClick={() => choose("accepted")}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
