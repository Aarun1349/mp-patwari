---
status: accepted
date: 2026-07
tags: [decision, rbac, auth]
---

# 0003 — Data-driven RBAC (roles are rows, not an enum)

## Context
Beyond `admin`, the business will need sub-admin, partner, creator, and later
sales/marketing/finance/support roles — with different visibility (platform-wide vs a
single tenant). Baking roles into an enum means a schema change for every new role.

## Decision
Roles are **data**: a `Role` row has a `permissions String[]` (keys from the
`PERMISSIONS` catalog in `../src/lib/auth/permissions.ts`) and a `scope`
(`platform` | `tenant`). `AdminUser` references a `Role` and an optional `tenantId`.
The `admin` role holds the `"*"` wildcard = every permission. System roles (admin/
sub_admin/partner/creator) are seeded and undeletable. Adding a new **role** is
inserting a row; only adding a new **capability** needs code (define a key + enforce
it).

## Alternatives considered
- **Enum of roles** — every new role = migration + code; can't be tuned in prod.
- **Full external policy engine (e.g. OPA)** — overkill for a solo-founder app; adds a
  moving part with no current payoff.

## Consequences
- **Good:** open-ended roles without schema churn; tenant vs platform scope is
  first-class; guards are small and composable (`requirePermission`,
  `checkPermission`, `requirePagePermission`, `tenantScopeWhere`, `canActOnTenant`).
- **Cost:** a role with a typo'd/missing key silently under-grants; callers of `.own`
  permissions must **also** scope by `tenantId` (the permission is the WHAT, the
  tenant check is the WHICH).
- **Follow-ups:** sales/marketing/finance roles when needed ([[Roadmap]]).

## Related
`../src/lib/auth/permissions.ts` · `../prisma/schema.prisma` (Role/AdminUser) ·
[[Business-Rules]] · [[Architecture]]
