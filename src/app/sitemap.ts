import type { MetadataRoute } from "next";
import { allSeoRoutes, SITE_URL } from "@/lib/seo/routes";

// Derived from the central SEO registry (src/lib/seo/routes.ts) — add exams and
// pages there, not here.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return allSeoRoutes().map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
