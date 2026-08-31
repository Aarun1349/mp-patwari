import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — ExamsExpress",
  description: "How ExamsExpress collects, uses and protects your data.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={LEGAL.lastUpdated}>
      <P>
        This policy explains how {LEGAL.legalEntity} (&ldquo;{LEGAL.companyName}&rdquo;) collects, uses, shares and
        protects your personal data, and your rights — including under India&rsquo;s Digital Personal Data Protection
        Act, 2023 (DPDP Act). We follow privacy-by-design and collect only what we need to run the platform.
      </P>

      <H2>1. Data we collect</H2>
      <UL
        items={[
          "Account: mobile number (for OTP sign-in) and/or email and name (for Google sign-in), plus authentication identifiers. We store only hashed OTPs and session tokens — never in plain text.",
          "Profile (optional): name, gender, date of birth, city/district, category, qualification and the exam you're preparing for.",
          "Usage: your mock-test attempts, answers, scores, section-wise analysis and activity events used to power your dashboard and history.",
          "Commerce: orders, test-credit entitlements and coupon usage. Payment/card details are handled entirely by our payment processor — we never store card data.",
          "Technical: IP address and device / user-agent for security, rate-limiting and session management; a small number of cookies (see below).",
        ]}
      />

      <H2>2. Why we use it (purposes)</H2>
      <UL
        items={[
          "To provide the service: run mock tests, compute scores and section-wise analysis, and unlock purchased tests.",
          "To operate commerce: process orders, issue tax invoices, and handle any refunds due under our policy.",
          "Security & integrity: authenticate you, prevent abuse, and record exam-integrity signals.",
          "Support & improvement: respond to your queries and improve our content and features.",
        ]}
      />

      <H2>3. Legal basis / consent</H2>
      <P>
        We process your data with your consent and as necessary to provide the service you request and to meet legal
        obligations (for example, tax records). You may withdraw consent for optional processing at any time.
      </P>

      <H2>4. Sharing</H2>
      <P>
        We do <strong>not</strong> sell your personal data. We share it only with processors who help us run the
        service — a payment processor (Razorpay), and infrastructure / email / messaging providers — under appropriate
        safeguards, and where required by law.
      </P>

      <H2>5. Retention</H2>
      <P>
        We keep account, attempt and transaction records for as long as your account is active and as required for
        legal, tax and dispute purposes (financial records for up to {LEGAL.invoiceRetentionYears} years), after which
        they are deleted or anonymised.
      </P>

      <H2>6. Your rights (incl. DPDP)</H2>
      <UL
        items={[
          "Access and correct your personal data (much of it is editable in your profile).",
          "Request deletion of your account and associated personal data, subject to records we must retain by law.",
          "Withdraw consent for optional processing.",
          "Raise a grievance with our Grievance Officer.",
        ]}
      />

      <H2>7. Security</H2>
      <P>
        We use encryption in transit, hashed passwords / OTPs, hashed session tokens, access controls, rate-limiting and
        audit logging. No system is perfectly secure, but we work to protect your data and will notify you of
        significant breaches as required by law.
      </P>

      <H2>8. Cookies</H2>
      <P>
        We use essential cookies for authentication and security. Any non-essential cookies (for example, analytics) are
        used only with your consent via our cookie banner.
      </P>

      <H2>9. Children</H2>
      <P>
        ExamsExpress is intended for competitive-exam aspirants and is not directed at children under 18. If you are
        below 18, please use the platform under the guidance of a parent or guardian.
      </P>

      <H2>10. Contact & Grievance Officer</H2>
      <P>
        Privacy questions: {LEGAL.supportEmail}. Grievance Officer: {LEGAL.grievanceOfficer.name},{" "}
        {LEGAL.grievanceOfficer.email}. Registered entity: {LEGAL.legalEntity}, {LEGAL.address}.
      </P>
    </LegalPage>
  );
}
