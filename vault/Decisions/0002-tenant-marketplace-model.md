---
status: accepted
date: 2026-07
tags: [decision, tenancy, marketplace]
---

# 0002 — Teacher marketplace via a platform tenant

## Context
The platform has no audience or trust of its own; **teachers do**. The viable
go-to-market is teachers-first: curated educators bring their students and sell mocks
under their own name, platform takes a cut ("YouTube for mocks"). This must not
require special-casing "platform content vs teacher content" everywhere.

## Decision
Introduce a **`Tenant`** (a teacher/coaching partner). The **platform itself is a
tenant** with the fixed id `"platform"` (`PLATFORM_TENANT_ID`). Every ownable row —
`Paper`, `Package`, `Order`, `UserCredit` — carries a non-null `tenantId` (default
`"platform"`). Tenants **build within** platform-owned `Exam`s; they **cannot create
exams**. Credits and attempts are isolated per `(user, exam, tenant)`. Buying a
teacher's package auto-enrols the student with that teacher (`Enrollment`).

## Alternatives considered
- **Nullable owner (null = platform)** — every credit/entitlement check would have to
  special-case null; error-prone. A fixed platform tenant makes the invariant "every
  row has an owner" hold everywhere.
- **Separate schema/DB per teacher** — massive operational overhead for a curated
  handful of teachers; kills cross-cutting queries (admin analytics).

## Consequences
- **Good:** isolation is uniform; no null branches; platform content is just
  "tenant = platform"; recruiting teachers becomes sales, not code.
- **Cost:** every ownable query must be tenant-scoped (enforced via
  `tenantScopeWhere`/`canActOnTenant`); forgetting a scope is the main risk.
- **Follow-ups:** storefront→purchase polish, tenant onboarding UX ([[Roadmap]]).

## Related
`../src/lib/tenant.ts` · `../src/lib/payments/creditOrder.ts` ·
[[Business-Rules]] (Tenancy & isolation) · [[Decisions/0003-data-driven-rbac]]
