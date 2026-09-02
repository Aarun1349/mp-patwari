---
status: in-progress   # planned | in-progress | done | blocked
date: 2026-09-03
tags: [task, mp-si, packages, pricing, e2e, phase-b]
owner: Arun
---

# Task — MP SI packages + end-to-end test

## Tomorrow's plan (2026-09-04)
Upload **1 Prelims mock + 1 Mains set (Paper 1 + Paper 2)**, then run an
**end-to-end test**: create/upload → activate → take → score → result review.

⚠️ Prelims E2E works on the current model today. A **Mains "set" (2 papers as one
unit, with negative marking) is not a first-class concept yet** — see Phase B. For
tomorrow either (a) build minimal Phase B, or (b) test the two Mains papers as two
ordinary papers to exercise scoring, and treat "set" packaging as Phase B.

## Confirmed pricing catalog (founder, 2026-09-03)
"Mains set" = Paper 1 + Paper 2 together, one unit. Combo "5+5" = 5 Prelims mocks + 5 Mains sets.

| # | Product | ₹ | MRP | Status |
|---|---|---|---|---|
| 1 | 1 Prelims | 99 | — | ✅ seeded |
| 2 | 5 Prelims | 399 | 449 | ✅ seeded |
| 3 | 10 Prelims | 599 | 699 | ✅ seeded |
| 4 | 1 Mains set | 199 | — | 🔧 Phase B |
| 5 | 5 Mains sets | 699 | 799 | 🔧 |
| 6 | 10 Mains sets | 849 | 999 | 🔧 (founder wrote "5 sets" twice; assumed 10) |
| 7 | 1 Prelims + 1 Mains set | 299 | — | 🔧 |
| 8 | 5 Prelims + 5 Mains sets | 1199 | — | 🔧 |
| 9 | 10 Prelims + 10 Mains sets | 1499 | — | 🔧 |

## Done (2026-09-03, on master)
- `Package.mrpPaise` (additive) + struck-through "was ₹X" on the buy page — generic, every exam.
- `seed-mp-si.ts` seeds Prelims SKUs 1–3 (idempotent by name+examId+tenantId; re-run refreshes prices).
- Package system is **exam-agnostic** — any exam/teacher gets tiers via admin `/packages` or its seed.

## Phase B — stage-scoped credits + combos (needed for SKUs 4–9)
Single-exam packages grant **fungible** credits (`UserCredit` unique per user×exam×tenant),
so prelims vs mains can't be split and combos can't be honestly granted. Proposed:
1. `Paper.stage` = PRELIMS | MAINS; a Mains mock = one "set" unit (2 papers).
2. `UserCredit` gains a `stage` dimension → credit pool per user×exam×**stage**×tenant.
3. Package grants `{prelimsCount, mainsCount}` (combo = both > 0).
4. Entitlement: prelims paper decrements prelims credit; mains set decrements mains credit.
Money-logic change → build carefully + test (see [[Business-Rules]]). Related: [[combo-cross-exam-bundles]] (cross-EXAM, separate).

## Also pending (not blockers for E2E)
- Deploy the current master (git pull → `db push` via migrate for legal + mrpPaise schema → `seed-mp-si.ts` → `up --build`).
- `lib/legal.ts` still placeholder legal identity (deployed with placeholders per founder call).
- Razorpay/PayU not live → purchases won't complete until payment gateway is sorted.
