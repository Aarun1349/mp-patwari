import "server-only";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/adminSession";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";

/**
 * Permission-key catalog. Roles (see the Role model) each bundle a set of these
 * keys as data, so a new role (sales, marketing, finance/GST, …) is added by
 * inserting a Role row — no code change. Adding a new *capability* is the only
 * thing that needs code: define a key here and enforce it where it applies.
 *
 * The `admin` role holds the "*" wildcard, which grants every permission.
 *
 * Suffix convention: `.own` means "only within the actor's own tenant" — the
 * caller must additionally scope the query/mutation by the admin's tenantId.
 * The un-suffixed variant (e.g. student.read) is the platform-wide version.
 */
export const PERMISSIONS = {
  // Platform-only
  EXAM_MANAGE: "exam.manage",
  TENANT_MANAGE: "tenant.manage",
  TENANT_ONBOARD: "tenant.onboard",
  ROLE_MANAGE: "role.manage",
  BILLING_MANAGE: "billing.manage",
  COUPON_MANAGE: "coupon.manage",
  CREDIT_GRANT: "credit.grant",
  PAYOUT_READ: "payout.read",
  STUDENT_READ: "student.read",
  ORDER_READ: "order.read",
  GRIEVANCE_MANAGE: "grievance.manage",
  NOTIFICATION_BROADCAST: "notification.broadcast",
  // Tenant-scoped (require additional tenantId scoping by the caller)
  PAPER_MANAGE_OWN: "paper.manage.own",
  PACKAGE_MANAGE_OWN: "package.manage.own",
  QUESTION_MANAGE_OWN: "question.manage.own",
  STUDENT_READ_OWN: "student.read.own",
  REVENUE_READ_OWN: "revenue.read.own",
  NOTIFICATION_SEND_OWN: "notification.send.own",
  BLOG_MANAGE: "blog.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const WILDCARD = "*";

type RoleBearer = { role?: { permissions: string[] } | null } | null | undefined;

/** Pure check against an already-loaded admin (with its role). */
export function hasPermission(bearer: RoleBearer, permission: Permission | string): boolean {
  const perms = bearer?.role?.permissions;
  if (!perms) return false;
  return perms.includes(WILDCARD) || perms.includes(permission);
}

export class PermissionError extends Error {
  constructor() {
    super("You don't have permission to do that.");
    this.name = "PermissionError";
  }
}

export type AdminSessionResult = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;

/**
 * Guard for admin/tenant server actions. Loads the current admin session (with
 * role) and asserts `permission`. Returns the session so the caller can scope by
 * `session.adminUser.tenantId` for `.own` permissions. Throws PermissionError if
 * not signed in or not permitted — callers that return `{ error }` should catch
 * it (or use `checkPermission` below for a boolean).
 */
export async function requirePermission(permission: Permission | string): Promise<AdminSessionResult> {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.adminUser, permission)) {
    throw new PermissionError();
  }
  return session;
}

/**
 * Non-throwing variant for the common action shape
 * `const g = await checkPermission(P); if ("error" in g) return g;`.
 * Returns the session on success, or an `{ error }` object on failure.
 */
export async function checkPermission(
  permission: Permission | string
): Promise<AdminSessionResult | { error: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Not authorized. Please sign in again." };
  if (!hasPermission(session.adminUser, permission)) {
    return { error: "You don't have permission to do that." };
  }
  return session;
}

/** The tenant a new resource created by this actor belongs to: a tenant-scoped
 * actor (partner/creator) owns it; a platform actor (admin) owns it as platform. */
export function actorTenantId(session: AdminSessionResult): string {
  return session.adminUser.tenantId ?? PLATFORM_TENANT_ID;
}

/**
 * WHICH-tenant guard, applied *after* the permission (WHAT) check: a
 * platform-scoped role (admin) may act on any tenant's resource; a tenant-scoped
 * role (partner/creator) only on rows owned by its own tenant.
 */
export function canActOnTenant(session: AdminSessionResult, resourceTenantId: string): boolean {
  if (session.adminUser.role?.scope === "platform") return true;
  return session.adminUser.tenantId === resourceTenantId;
}

/**
 * Page-level guard for /admin Server Components. Redirects to /admin/login if not
 * signed in, or to the /admin home (which renders a role-appropriate view) if the
 * role lacks `permission` — so a tenant-scoped partner can't URL-hack to a
 * platform page (users, payouts, orders, …). Returns the session on success.
 */
export async function requirePagePermission(permission: Permission | string): Promise<AdminSessionResult> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasPermission(session.adminUser, permission)) redirect("/admin");
  return session;
}

/**
 * A Prisma `where` fragment that scopes a listing to what this actor may see: an
 * empty object for platform roles (all rows), or `{ tenantId }` for a tenant-
 * scoped role so a partner's lists show only their own content.
 */
export function tenantScopeWhere(session: AdminSessionResult): { tenantId?: string } {
  if (session.adminUser.role?.scope === "platform") return {};
  return { tenantId: session.adminUser.tenantId ?? PLATFORM_TENANT_ID };
}
