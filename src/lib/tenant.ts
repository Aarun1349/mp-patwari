/**
 * The platform's own tenant id (see the Tenant model). Platform-owned content
 * and all pre-marketplace rows use this fixed id, so every Paper/Package/Order/
 * UserCredit has a non-null owner and credit/entitlement checks never special-
 * case null. Teacher/coaching tenants have their own generated ids.
 */
export const PLATFORM_TENANT_ID = "platform";

/** Apex domain the tenant storefront subdomains hang off. */
export const STOREFRONT_APEX = "examsexpress.in";

/**
 * Public, branded storefront URL for a tenant: `https://<slug>.examsexpress.in`.
 * NOTE: the subdomain only resolves once wildcard DNS (`*.examsexpress.in`) and
 * wildcard/on-demand TLS are configured on the server; until then the path form
 * `https://examsexpress.in/t/<slug>` still works (the middleware rewrites the
 * subdomain to that route). Safe to import from client components (no secrets).
 */
export function storefrontUrl(slug: string): string {
  return `https://${slug}.${STOREFRONT_APEX}`;
}

/**
 * The href to link a tenant storefront from inside the app. In production this
 * is the clean branded subdomain (`https://<slug>.examsexpress.in`); in local
 * dev, where subdomains don't resolve, it falls back to the on-site `/t/<slug>`
 * route the middleware rewrites the subdomain to. Use this for in-app links so
 * users see the subdomain in prod, never the internal `/t/` path.
 */
export function storefrontHref(slug: string): string {
  return process.env.NODE_ENV === "production" ? storefrontUrl(slug) : `/t/${slug}`;
}
