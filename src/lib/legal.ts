// ⚠️ PLACEHOLDER LEGAL CONFIG — REVIEW WITH COUNSEL BEFORE THIS BRANCH DEPLOYS.
// Fill in the real registered entity, CIN, address and grievance-officer details.
// The legal-page copy this drives is an India-aware DRAFT template, NOT legal advice.
//
// Split of concerns: this file holds the legal IDENTITY + policy constants. GST
// rate / GSTIN / SAC are commerce config and live in `billing/tax.ts` (env-driven,
// tax OFF until a CA confirms) — do not duplicate them here.
//
// Client-safe: only static literals, no `process.env`, so both server pages and
// the client cookie-consent banner can import it.

export const LEGAL = {
  companyName: "ExamsExpress",
  legalEntity: "[Registered legal entity — e.g. AMTECH … Pvt. Ltd. / Proprietorship]",
  cin: "[CIN, if incorporated]",
  address: "[Registered office address, Gwalior, Madhya Pradesh, PIN]",
  supportEmail: "support@examsexpress.in",
  grievanceOfficer: { name: "[Grievance Officer Name]", email: "grievance@examsexpress.in" },
  jurisdiction: "the courts of Gwalior, Madhya Pradesh, India",
  lastUpdated: "31 August 2026",

  // Commerce policy
  // ExamsExpress currently states "all purchases are final — no refunds" on the buy
  // page. Certur ships a 7-day self-service window; enabling one here is a business
  // + counsel decision. 0 = no self-service refund window (matches the live policy).
  refundWindowDays: 0,

  // Data protection (DPDP Act 2023)
  invoiceRetentionYears: 8, // financial/tax records retained even after account erasure (confirm with counsel)

  // Teacher (marketplace) legal backbone — ⚠️ CONFIRM ALL WITH COUNSEL/CA.
  payout: {
    agreementVersion: "2026-08", // bump when the teacher agreement text changes → re-acceptance required
    // TDS withheld on teacher payouts. Content authoring = professional service →
    // Sec. 194J (10%). No valid PAN → higher rate (20%) per Sec. 206AA. A CA must
    // confirm the correct section (194J vs 194C vs 194-O e-commerce) for the model.
    tds: { section: "194J", ratePercent: 10, noPanRatePercent: 20 },
  },
} as const;

/** TDS (in paise) to withhold on a teacher payout. Higher rate when no valid PAN. */
export function computeTds(grossPaise: number, hasPan: boolean) {
  const rate = hasPan ? LEGAL.payout.tds.ratePercent : LEGAL.payout.tds.noPanRatePercent;
  const tdsPaise = Math.round((grossPaise * rate) / 100);
  return { tdsPaise, ratePercent: rate, section: LEGAL.payout.tds.section };
}
