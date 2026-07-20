import type { MetadataRoute } from "next";

const BASE = "https://examsexpress.in";

// Public, indexable pages only. Auth-gated / dynamic app routes (admin, exam,
// dashboard, profile, api) are intentionally excluded — see robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0 },
    { path: "/mp-tet-varg-2", priority: 0.9 },
    { path: "/mp-tet-varg-2/syllabus", priority: 0.8 },
    { path: "/mp-tet-varg-2/exam-pattern", priority: 0.8 },
    { path: "/mp-tet-varg-2/eligibility", priority: 0.7 },
    { path: "/packages", priority: 0.6 },
    { path: "/how-it-works", priority: 0.5 },
    { path: "/about", priority: 0.4 },
    { path: "/disclaimer", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r.priority,
  }));
}
