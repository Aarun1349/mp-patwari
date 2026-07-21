/**
 * The platform's own tenant id (see the Tenant model). Platform-owned content
 * and all pre-marketplace rows use this fixed id, so every Paper/Package/Order/
 * UserCredit has a non-null owner and credit/entitlement checks never special-
 * case null. Teacher/coaching tenants have their own generated ids.
 */
export const PLATFORM_TENANT_ID = "platform";
