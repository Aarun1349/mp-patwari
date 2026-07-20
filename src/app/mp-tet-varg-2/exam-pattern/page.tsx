import type { Metadata } from "next";
import StaticSeoPage from "../StaticSeoPage";
import { mptetPattern } from "../mptet-content";

export const metadata: Metadata = {
  title: "MP TET Varg 2 Exam Pattern 2026 — 100 Q, No Negative Marking | ExamsExpress",
  description:
    "MP TET Varg 2 2026 exam pattern: 100 questions, 100 marks, 2 hours, CBT, no negative marking, section-wise weightage and preparation tips.",
  keywords: [
    "MP TET Varg 2 exam pattern 2026",
    "MP TET Varg 2 marking scheme",
    "MP TET Varg 2 CBT",
    "MPESB teacher exam pattern",
  ],
  alternates: { canonical: "https://examsexpress.in/mp-tet-varg-2/exam-pattern" },
  openGraph: {
    title: "MP TET Varg 2 Exam Pattern 2026",
    description:
      "100 questions, 100 marks, 2 hours, no negative marking. Section-wise weightage and prep tips.",
    url: "https://examsexpress.in/mp-tet-varg-2/exam-pattern",
    siteName: "ExamsExpress",
    type: "article",
  },
};

export default function MpTetExamPatternPage() {
  return <StaticSeoPage content={mptetPattern} />;
}
