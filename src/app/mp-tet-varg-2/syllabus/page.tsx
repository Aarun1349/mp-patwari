import type { Metadata } from "next";
import StaticSeoPage from "../StaticSeoPage";
import { mptetSyllabus } from "../mptet-content";

export const metadata: Metadata = {
  title: "MP TET Varg 2 Syllabus 2026 (Maths + Pedagogy) | ExamsExpress",
  description:
    "Complete MP TET Varg 2 2026 syllabus with topic-wise Mathematics, Child Development & Pedagogy, and general subjects. Free mock tests on ExamsExpress.",
  keywords: [
    "MP TET Varg 2 syllabus 2026",
    "MP TET Varg 2 maths syllabus",
    "MP TET Varg 2 pedagogy syllabus",
    "MPESB Varg 2 syllabus",
  ],
  alternates: { canonical: "https://examsexpress.in/mp-tet-varg-2/syllabus" },
  openGraph: {
    title: "MP TET Varg 2 Syllabus 2026 (incl. Mathematics)",
    description:
      "Topic-wise Maths syllabus, Child Development & Pedagogy, and general subjects for MP TET Varg 2 2026.",
    url: "https://examsexpress.in/mp-tet-varg-2/syllabus",
    siteName: "ExamsExpress",
    type: "article",
  },
};

export default function MpTetSyllabusPage() {
  return <StaticSeoPage content={mptetSyllabus} />;
}
