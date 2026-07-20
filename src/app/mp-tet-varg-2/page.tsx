import type { Metadata } from "next";
import MpTetLandingClient from "./MpTetLandingClient";
import { mptetLanding } from "./mptet-content";

export const metadata: Metadata = {
  title: "MP TET Varg 2 Maths Mock Test 2026 — Free Online Test | ExamsExpress",
  description:
    "Free MP TET Varg 2 2026 Maths mock tests — real CBT interface, 100 questions, 2 hours, no negative marking. Syllabus, exam pattern and eligibility included.",
  keywords: [
    "MP TET Varg 2 2026",
    "MP TET Varg 2 mock test",
    "MP TET Varg 2 maths mock test",
    "MP TET Varg 2 free test",
    "MP TET Varg 2 test series",
    "MPESB Varg 2 teacher exam",
  ],
  alternates: { canonical: "https://examsexpress.in/mp-tet-varg-2" },
  openGraph: {
    title: "MP TET Varg 2 Maths Mock Test 2026 — Free Online Test",
    description:
      "Real CBT-style MP TET Varg 2 Maths mock tests. 100 questions, 2 hours, no negative marking. First test free.",
    url: "https://examsexpress.in/mp-tet-varg-2",
    siteName: "ExamsExpress",
    type: "website",
  },
};

// FAQ structured data (Hindi — matches the page's default lang) so the page is
// eligible for FAQ rich results in Google.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mptetLanding.hi.faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function MpTetVarg2Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <MpTetLandingClient />
    </>
  );
}
