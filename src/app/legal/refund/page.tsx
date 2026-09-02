import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — ExamsExpress",
  description: "When and how refunds apply on ExamsExpress.",
  alternates: { canonical: "/legal/refund" },
};

// ExamsExpress currently operates a no-refund policy (LEGAL.refundWindowDays === 0),
// matching the "all purchases are final" note on the buy page. If a self-service
// refund window is enabled later (set refundWindowDays > 0), update this copy and
// wire the refund flow accordingly.
export default function RefundPage() {
  const hasWindow = LEGAL.refundWindowDays > 0;
  return (
    <LegalPage title="Refund & Cancellation Policy" updated={LEGAL.lastUpdated}>
      <P>
        This policy explains when refunds apply to purchases on {LEGAL.companyName}. Test credits are delivered to your
        account instantly on successful payment, which is why purchases are treated as final.
      </P>

      {hasWindow ? (
        <>
          <H2>1. Eligibility window</H2>
          <P>
            You may request a refund within <strong>{LEGAL.refundWindowDays} days</strong> of purchase, provided you
            have not substantially used the package. Free tests are, of course, free and not covered.
          </P>
        </>
      ) : (
        <>
          <H2>1. Purchases are final</H2>
          <P>
            Because paid test credits are added to your account and usable immediately, <strong>all purchases are
            final and non-refundable</strong> once payment succeeds, except in the limited cases below.
          </P>
        </>
      )}

      <H2>2. Limited exceptions</H2>
      <P>Regardless of the above, we will make it right in these cases:</P>
      <UL
        items={[
          "Duplicate charge — you were charged more than once for the same order.",
          "Payment captured but credits not delivered due to a technical error on our side, and we cannot deliver them.",
          "A package you were charged for was materially not as described.",
        ]}
      />

      <H2>3. What is not refundable</H2>
      <UL
        items={[
          "Test credits that have already been used (a mock started or submitted).",
          "Purchases made with clearly-marked non-refundable or promotional offers.",
          "Change of mind after credits are delivered.",
        ]}
      />

      <H2>4. How to request</H2>
      <P>
        Email {LEGAL.supportEmail} with your registered mobile / email and order number, describing the issue. We
        review eligible cases and, where a refund is due, process it to your original payment method.
      </P>

      <H2>5. Processing time</H2>
      <P>
        Approved refunds are initiated promptly; the amount typically reflects in your account within 5–7 business
        days, depending on your bank / payment provider. On a refund, the related test credits are revoked.
      </P>

      <H2>6. Cancellations</H2>
      <P>A pending (unpaid) order can be abandoned at any time; nothing is charged until you complete payment.</P>

      <H2>7. Contact</H2>
      <P>
        Questions about a refund: {LEGAL.supportEmail} · Grievance Officer: {LEGAL.grievanceOfficer.name},{" "}
        {LEGAL.grievanceOfficer.email}.
      </P>
    </LegalPage>
  );
}
