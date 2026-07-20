import type { Metadata } from "next";
import StaticSeoPage from "../StaticSeoPage";
import { mptetEligibility } from "../mptet-content";

export const metadata: Metadata = {
  title: "MP TET Varg 2 Eligibility 2026 — Qualification & Criteria | ExamsExpress",
  description:
    "MP TET Varg 2 2026 eligibility: graduation, teacher-training qualification and general criteria. Confirm exact rules on the official MPESB notification.",
  keywords: [
    "MP TET Varg 2 eligibility 2026",
    "MP TET Varg 2 qualification",
    "MPESB Varg 2 eligibility criteria",
  ],
  alternates: { canonical: "https://examsexpress.in/mp-tet-varg-2/eligibility" },
  openGraph: {
    title: "MP TET Varg 2 Eligibility 2026",
    description:
      "Graduation, teacher-training qualification and general criteria for MP TET Varg 2 2026.",
    url: "https://examsexpress.in/mp-tet-varg-2/eligibility",
    siteName: "ExamsExpress",
    type: "article",
  },
};

export default function MpTetEligibilityPage() {
  return <StaticSeoPage content={mptetEligibility} />;
}
