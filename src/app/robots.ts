import type { MetadataRoute } from "next";

const BASE = "https://examsexpress.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated, dynamic and internal routes — no SEO value, keep out of the index.
      disallow: ["/admin", "/api", "/exam", "/dashboard", "/profile", "/purchases", "/history"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
