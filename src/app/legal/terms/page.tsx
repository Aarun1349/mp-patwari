import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — ExamsExpress",
  description: "The terms governing your use of ExamsExpress.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={LEGAL.lastUpdated}>
      <P>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of {LEGAL.companyName}, operated by{" "}
        {LEGAL.legalEntity} (&ldquo;{LEGAL.companyName}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an
        account or using the service you agree to these Terms.
      </P>

      <H2>1. What ExamsExpress is</H2>
      <P>
        ExamsExpress provides original, <strong>exam-style mock tests and practice analytics</strong> for Indian
        competitive examinations. ExamsExpress is a preparation and measurement tool. It is <strong>not</strong> the
        official examination, and a practice score does <strong>not</strong> guarantee that you will clear any real exam.
      </P>

      <H2>2. No affiliation; trademarks</H2>
      <P>
        ExamsExpress is not affiliated with, endorsed by, sponsored by, or authorised by any examining or recruiting
        body (including but not limited to MPESB / MPPEB, NCTE, or any state or central board). All exam names, logos and
        trademarks are the property of their respective owners and are used only to identify the exam a practice set
        relates to.
      </P>

      <H2>3. Eligibility & accounts</H2>
      <UL
        items={[
          "You must be at least 18 years old (or have the capacity to contract under applicable law) to use ExamsExpress.",
          "You are responsible for your account credentials and all activity under your account.",
          "Provide accurate information and keep it up to date.",
        ]}
      />

      <H2>4. Licence & acceptable use</H2>
      <P>
        We grant you a personal, non-exclusive, non-transferable licence to use ExamsExpress for your own preparation.
        You agree not to:
      </P>
      <UL
        items={[
          "Copy, scrape, redistribute, resell or publicly post our questions, explanations or content.",
          "Attempt to extract answer keys, circumvent the exam environment, or interfere with scoring or entitlements.",
          "Share your account or purchased test credits with others.",
          "Upload or submit unlawful, infringing, or leaked / NDA-protected exam material.",
        ]}
      />

      <H2>5. Teacher marketplace content</H2>
      <P>
        Some mock tests and packages are provided by independent teachers who sell under their own name on ExamsExpress.
        Those teachers are responsible for the content they publish and warrant it is their own original work.
        ExamsExpress operates the platform and payments; it does not author third-party teachers&rsquo; content.
      </P>

      <H2>6. Purchases, entitlements & taxes</H2>
      <UL
        items={[
          "Paid packages grant time-limited test credits for the exam they cover; access begins on payment and ends at the stated validity.",
          "Prices are shown in INR, inclusive of GST where applicable. A tax invoice is issued for each paid order.",
          "Refunds are governed by our Refund & Cancellation Policy.",
        ]}
      />

      <H2>7. Content integrity</H2>
      <P>
        Our practice content is created to map to publicly available exam patterns. We prohibit the use of leaked,
        stolen, NDA-protected, or copyrighted exam material anywhere on the platform.
      </P>

      <H2>8. Intellectual property</H2>
      <P>
        All ExamsExpress software, question banks, analytics and branding are owned by us or our licensors. You retain
        ownership of content you submit (for example, feedback), and grant us a licence to use it to operate and improve
        the service.
      </P>

      <H2>9. Disclaimers & limitation of liability</H2>
      <P>
        ExamsExpress is provided &ldquo;as is&rdquo; without warranties of any kind. We do not warrant that use of the
        platform will result in clearing any examination. To the maximum extent permitted by law, our aggregate
        liability arising from your use of ExamsExpress is limited to the amount you paid us in the twelve months
        preceding the claim.
      </P>

      <H2>10. Termination</H2>
      <P>We may suspend or terminate accounts that breach these Terms. You may stop using ExamsExpress at any time.</P>

      <H2>11. Governing law & disputes</H2>
      <P>These Terms are governed by the laws of India, subject to the exclusive jurisdiction of {LEGAL.jurisdiction}.</P>

      <H2>12. Changes</H2>
      <P>We may update these Terms; material changes will be notified. Continued use constitutes acceptance.</P>

      <H2>13. Contact & grievances</H2>
      <P>
        Questions: {LEGAL.supportEmail}. Grievance Officer (per applicable IT / consumer rules):{" "}
        {LEGAL.grievanceOfficer.name}, {LEGAL.grievanceOfficer.email}.
      </P>
    </LegalPage>
  );
}
