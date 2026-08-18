"use client";

import { useState } from "react";

/**
 * Storefront URL cell: the branded URL as a link that opens in a new tab
 * (external-link icon), plus a one-click copy-to-clipboard button.
 */
export function StorefrontLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <span className="ee-storefront">
      <a href={url} target="_blank" rel="noopener noreferrer" className="ee-storefront__link" title="Open storefront in a new tab">
        {display}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
      <button
        type="button"
        className="ee-storefront__copy"
        onClick={copy}
        title={copied ? "Copied!" : "Copy URL"}
        aria-label="Copy storefront URL"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      {copied && <span className="ee-storefront__toast">Copied</span>}
    </span>
  );
}
