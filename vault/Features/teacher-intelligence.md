---
status: in-progress   # planned | in-progress | done | blocked
date: 2026-09-06
tags: [feature, analytics, usp, b2b2c, teacher, pitch]
owner: Arun
---

# Feature — Teacher Intelligence (the B2B2C USP)

## Why (strategic)
Competitor research (2026-09-06) killed the "premium mock library" thesis: the market
is saturated + cheap (Testbook 500+ tests, WiNNERS 55 tests/₹199, free everywhere). A
solo player can't win B2C on quantity/price/brand. **The defensible position is B2B2C:
sell the testing PLATFORM to local coaching institutes** — who have content + students +
trust but no tech. The "why pay" for a teacher is the one thing Testbook deliberately
does NOT give them: **topic/section-level visibility into each student's weakness** (their
business intelligence). See the founder's research + `mp-exams-2026` reference.

## What (built 2026-09-06)
Two teacher-facing views, both reusing the per-attempt section scoring already in the engine:

1. **Per-student "Preparation X-ray"** — `admin/users/[userId]`. Across a student's
   completed attempts, section-level accuracy/correct/skipped/marks-lost, weakest first,
   colour-coded, with the two weakest areas called out.
   → `lib/exam/studentAnalytics.getStudentSectionWeakness(userId)`
2. **"Class Insights"** — on the partner (teacher) dashboard `PartnerHome`, tenant-scoped:
   class-wide weakest sections + at-risk students (lowest accuracy). "Where do I focus my
   class, and who do I pull aside."
   → `getCohortAnalytics(tenantId)` (no cross-tenant leak)

Both data-proven: `scripts/demo-weakness.ts`, `scripts/demo-cohort.ts`. Additive, no schema
change, builds clean.

## Pitch role
This IS the demo centerpiece. The pitch to a local institute: *"your content, your students,
your brand — plus per-student + class topic-weakness that no one else gives you."*

## Still needed before a live pitch (see [[Current-State]])
- **A demo mock with real questions** (mocks are drafts/empty — can't demo taking a test yet). Biggest blocker.
- **Bilingual toggle** relies on live Groq translation (fragile) — key not set on prod → silent fallback; robust fix = pre-translate on activation (also a selling point).
- Student mock-listing bug (only one mock shows / unclear which).
- Topic-level (below section) + longitudinal "marks recovered over tests" = future depth.
