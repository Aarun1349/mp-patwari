import type { Metadata } from "next";
import ExamSeoLanding from "@/components/ExamSeoLanding";
import { msiLanding } from "./msi-content";

export const metadata: Metadata = {
  title: "MP SI / Subedar Mock Test 2026 — Free Online Prelims Test | ExamsExpress",
  description:
    "Free MP Police SI / Subedar 2026 Prelims mock tests — real CBT interface, 100 questions, 2 hours, no negative marking. Notification out, applications from 9 September.",
  keywords: [
    "MP SI 2026",
    "MP Subedar 2026",
    "MP SI mock test",
    "MP Police SI free test",
    "MP SI prelims mock test",
    "MP SI test series 2026",
    "MPESB SI Subedar",
  ],
  alternates: { canonical: "https://examsexpress.in/mp-si" },
  openGraph: {
    title: "MP SI / Subedar Mock Test 2026 — Free Online Prelims Test",
    description:
      "Real CBT-style MP SI / Subedar Prelims mock tests. 100 questions, 2 hours, no negative marking. First test free.",
    url: "https://examsexpress.in/mp-si",
    siteName: "ExamsExpress",
    type: "website",
  },
};

// FAQ structured data (Hindi — matches the page's default lang) for FAQ rich results.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: msiLanding.hi.faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function MpSiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ExamSeoLanding landing={msiLanding} examBoardLabel="MP SI" admitTag="#MP-SI-2026" startHref="/login" />
    </>
  );
}
