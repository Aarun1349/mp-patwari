---
status: planned   # planned | in-progress | done | blocked
date: 2026-08-19
tags: [feature, packages, marketplace, money, entitlement]
owner: Arun
---

# Feature — Combo / cross-exam bundles (Phase 2)

## Problem / why
Founder captured a real student demand signal: buyers want **combo bundles that span
multiple exams**, e.g. *"3 Railway + 3 SSC + 3 MP PEB"*. Today a `Package` is bound to
a **single** `examId` with a single `testCount`, and entitlement (`UserCredit`) is
**unique per `(userId, examId, tenantId)`** — so one purchase cannot honestly grant
tests across several exams. This feature adds a first-class bundle concept.

## The core constraint (why this is not just a UI change)
- `Package.examId` is single-valued → cannot express 3+3+3.
- `UserCredit` is per-exam → credits are **not** generic/fungible across exams. Good
  for honest accounting; means a combo must fan out into **multiple** entitlements.
- Touches 🔒 **money idempotency** ([[0004-idempotent-money]]): one payment must
  create/increment N entitlements **exactly once**, even on webhook retries.

## Recommended model (to be ratified as an ADR before building)
Introduce a bundle that is a **list of line-items**, each granting its own entitlement:

```
BundlePackage { id, name, pricePaise, validityDays, isActive, sortOrder, tenantId }
BundleItem    { id, bundleId, examId, tenantId, testCount }   // 1..N per bundle
```

On successful payment (single `Order`, idempotent):
- for each `BundleItem` → upsert `UserCredit(userId, item.examId, item.tenantId)`,
  incrementing `testsRemaining` by `item.testCount` (same primitive today's single
  package purchase already uses — reuse it, loop over items).
- Idempotency key stays the `Order` / Razorpay payment id; the fan-out must be
  inside the same "mark order paid" transaction so retries are no-ops.

Pricing: show **"Save ₹X vs buying separately"** (sum of per-exam list prices −
bundle price). Keep a single "Most Popular"/anchor.

### Alternatives considered
- **Generic credits** (one credit usable on any paper): simplest, but a student could
  spend all 9 on one exam — the "3+3+3" promise becomes marketing-only / dishonest.
  Rejected.
- **Relax `UserCredit` to be cross-exam**: breaks per-exam accounting + revenue-share
  attribution per tenant/exam. Rejected.

## Content constraint (decided 2026-08-19)
Combos ship **only on live exams** (currently **MP PEB / Patwari + MP TET**). No
"coming soon" pre-sell of Railway/SSC — the "no refund" policy makes pre-selling
non-existent content a trust/legal risk. Railway/SSC combos wait until those exams +
papers actually exist.

## Scope
- In: bundle schema + admin CRUD for bundles, buy-page "Combo Bundles" section,
  idempotent multi-entitlement fan-out on purchase, "Save ₹X" badge.
- Out (v3): **self-serve "build your own combo"** (student picks exams/counts).

## Acceptance (draft)
- [ ] Purchasing a bundle creates exactly the promised per-exam credits, once.
- [ ] Webhook retry / double-submit never double-grants ([[0004-idempotent-money]]).
- [ ] Revenue-share attribution correct per tenant/exam line-item.
- [ ] Bundle validity + per-exam expiry behave sensibly.
- [ ] Admin can create/deactivate bundles.

## Open questions
- One shared `validityDays` for the whole bundle, or per line-item?
- Can a bundle mix **platform + teacher** items, or platform-only in v2?
- Revenue-share: how is a mixed-tenant bundle split? (blocks teacher combos)

## Related
- Phase 1: [[packages-marketplace-restructure]]
- [[0004-idempotent-money]], [[0002-tenant-marketplace-model]], [[0001-config-driven-exams]]
- **Needs an ADR** in `../Decisions/` before implementation.
