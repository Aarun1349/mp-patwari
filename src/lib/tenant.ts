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
