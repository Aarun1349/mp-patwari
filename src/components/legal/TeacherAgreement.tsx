import { LEGAL } from "@/lib/legal";

// ⚠️ DRAFT teacher (contractor) agreement — structurally complete, but a lawyer
// must finalise the wording before it is used to onboard real teachers. Version
// is LEGAL.payout.agreementVersion; bump it when the text changes → re-acceptance.
export function TeacherAgreement({
  teacherName,
  revenueSharePct,
}: {
  teacherName: string;
  revenueSharePct: number;
}) {
  return (
    <div className="legal-prose" style={{ maxWidth: "none", padding: 0 }}>
      <p className="legal-p">
        This agreement is between {LEGAL.legalEntity} (&ldquo;{LEGAL.companyName}&rdquo;, the platform) and{" "}
        <strong>{teacherName}</strong> (&ldquo;you&rdquo;, the teacher), effective on acceptance. Version{" "}
        {LEGAL.payout.agreementVersion}.
      </p>

      <h2 className="legal-h2">1. Your content & IP assignment</h2>
      <p className="legal-p">
        You may publish original mock tests, questions and explanations to sell on the platform under your name. You
        warrant that all content is your own original work, and you grant {LEGAL.companyName} a worldwide, royalty-free
        licence to host, display, sell and deliver it to students. You retain authorship credit.
      </p>

      <h2 className="legal-h2">2. No leaked or copyrighted material</h2>
      <p className="legal-p">
        You warrant that your content contains <strong>no leaked, stolen, NDA-protected or copyrighted exam material</strong>{" "}
        (&ldquo;exam dumps&rdquo;). This is a fundamental term; breach permits immediate removal of content and
        termination, and you indemnify {LEGAL.companyName} against claims arising from your content.
      </p>

      <h2 className="legal-h2">3. Revenue share</h2>
      <p className="legal-p">
        You earn <strong>{revenueSharePct}%</strong> of the ex-GST value of each paid sale attributed to your content;{" "}
        {LEGAL.companyName} retains the remainder as its platform fee. Earnings are computed on paid orders and settled
        periodically, after any refunds in the applicable window are accounted for.
      </p>

      <h2 className="legal-h2">4. Taxes & TDS</h2>
      <p className="legal-p">
        Your earnings are a professional fee. {LEGAL.companyName} will withhold tax at source (TDS) as required —
        currently Sec. {LEGAL.payout.tds.section} at {LEGAL.payout.tds.ratePercent}% where a valid PAN is on file, and{" "}
        {LEGAL.payout.tds.noPanRatePercent}% where it is not — and deposit it against your PAN. You are responsible for
        your own income-tax and GST obligations. Payouts require verified KYC (PAN + bank/UPI).
      </p>

      <h2 className="legal-h2">5. Conduct</h2>
      <p className="legal-p">
        You will keep content accurate and lawful, will not misrepresent affiliation with any exam board, and will not
        attempt to poach students off-platform or share the platform&rsquo;s data.
      </p>

      <h2 className="legal-h2">6. Term & termination</h2>
      <p className="legal-p">
        Either party may end this arrangement with notice. On termination, cleared earnings up to that point remain
        payable; {LEGAL.companyName} may retain content already sold so existing students keep access. Sections 1, 2 and
        4 survive termination.
      </p>

      <h2 className="legal-h2">7. Governing law</h2>
      <p className="legal-p">This agreement is governed by the laws of India, subject to {LEGAL.jurisdiction}.</p>
    </div>
  );
}
