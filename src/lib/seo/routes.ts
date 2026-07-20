import type { MetadataRoute } from "next";

// Central registry of public, indexable routes — the single source of truth for
// SEO surface area. sitemap.ts derives from this, so onboarding a new exam is a
// one-line entry here, not a sitemap edit.
//
// This is the first brick of the eventual content system: blog posts and
// dynamic /[examSlug]/[pageSlug] routes + generateMetadata can read from this
// same registry later. Auth-gated/dynamic app routes are intentionally absent
// (see robots.ts).

export const SITE_URL = "https://examsexpress.in";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

export type SeoRoute = {
  /** Absolute path from the site root, e.g. "/mp-tet-varg-2/syllabus". */
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
};

// Evergreen marketing / info pages.
const staticRoutes: SeoRoute[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/packages", priority: 0.6, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" },
];

// One SEO content cluster per exam. Add an exam here and every page flows into
// the sitemap automatically.
export type ExamSeoCluster = {
  slug: string;
  /** Sub-pages relative to /{slug}. "" is the pillar landing page itself. */
  pages: { sub: string; priority: number }[];
};

const examClusters: ExamSeoCluster[] = [
  {
    slug: "mp-tet-varg-2",
    pages: [
      { sub: "", priority: 0.9 },
      { sub: "/syllabus", priority: 0.8 },
      { sub: "/exam-pattern", priority: 0.8 },
      { sub: "/eligibility", priority: 0.7 },
    ],
  },
];

function examRoutes(): SeoRoute[] {
  return examClusters.flatMap((cluster) =>
    cluster.pages.map((page) => ({
      path: `/${cluster.slug}${page.sub}`,
      priority: page.priority,
      changeFrequency: "weekly" as const,
    }))
  );
}

/** Every public route the sitemap should advertise. */
export function allSeoRoutes(): SeoRoute[] {
  return [...staticRoutes, ...examRoutes()];
}
