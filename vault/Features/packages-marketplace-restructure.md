---
status: in-progress   # planned | in-progress | done | blocked
date: 2026-08-19
tags: [feature, storefront, packages, marketplace]
owner: Arun
---

# Feature — Packages page marketplace restructure

## Problem / why
The student **Buy Tests** page (`../src/app/packages/page.tsx`) showed a single flat
grid of the active exam's packages. As we move to the teacher-marketplace model
(see [[0002-tenant-marketplace-model]]), the buy page must (a) lead with **our own
house packages**, and (b) let students **explore more** — by exam and by teacher —
so the catalogue can grow without the page becoming a wall.

Founder input also captured a demand signal: students want **combo bundles across
exams** (e.g. "3 Railway + 3 SSC + 3 MP PEB"). That is a separate, deeper change —
see the Combo section below (Phase 2).

## Scope
- **In (Phase 1 — done 2026-08-19):** presentational restructure of the buy page
  into three data-driven buckets, no schema change:
  1. **ExamsExpress Official** — our (`tenantId = "platform"`) packages for the
     flagship exam ([[0001-config-driven-exams]] default exam), pushed to the top,
     with an "Official" badge + the per-exam credit balance.
  2. **Explore more exams** — our packages for *other* exams, grouped by exam.
  3. **From independent teachers** — non-platform packages, grouped by tenant, each
     group linking to that teacher's storefront (`/t/<slug>`).
  Sections 2 & 3 **hide when empty** (today only flagship platform packages exist,
  so the page reads like before but with the new header + structure).
- **Out (deliberately, Phase 1):**
  - Interactive exam/teacher **tabs/filters** — Phase 1 uses server-rendered
    grouped sections (no client state). Tabs are a later polish.
  - **Browse by subject** — packages are exam-scoped, not subject-scoped; needs
    subject-tagged papers/packages first. Deferred.
  - **Combo / cross-exam bundles** — Phase 2 (own note below).

## Design notes
- File: `../src/app/packages/page.tsx` (server component). One `prisma.package.findMany`
  (`isActive`, include `exam` + `tenant`) then bucketed in memory by `tenantId` /
  `examId`. Preserves the existing **top-up visibility rule** (`kind === "topup"`
  only shown to repeat buyers, `testsTotalPurchased > 0`).
- Credit balance shown is for the **flagship exam only** — `UserCredit` is unique
  per `(userId, examId, tenantId)` (🔒 [[Business-Rules]] per-exam entitlement).
- CSS: new classes in `../src/app/globals.css` — `.section-head`, `.official-badge`,
  `.explore-title`, `.explore-group(-head/-title)`, `.explore-store-link`, plus
  `.auth-card-wide + .auth-card-wide` spacing. Purple design system.
- Part of the student-side purple reskin (see [[ui-design-overhaul]]).

## Acceptance
- [x] Our flagship-exam packages render first under an "Official" header.
- [x] Other-exam and teacher sections render only when such packages exist.
- [x] Teacher groups link to `/t/<slug>`.
- [x] Top-up gating + per-exam credit line preserved.
- [x] Compiles clean (verified: `/packages` executes + redirects unauthenticated).
- [ ] Visual check by founder while logged in (in-app browser has no student session).

## Open questions
- Should "Explore more exams" eventually become the primary nav (exam picker) vs a
  section on the buy page? Ties into multi-exam phase ([[0001-config-driven-exams]]).

## Related
- [[0002-tenant-marketplace-model]], [[0001-config-driven-exams]], [[ui-design-overhaul]]
- Phase 2: [[combo-cross-exam-bundles]]
