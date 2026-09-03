---
status: accepted
date: 2026-09-03
tags: [decision, data-model, exams, config-driven, stages]
---

# 0007 — Stage-based exam config (config-driven mocks & packages)

## Context
[[0001-config-driven-exams]] made exams data (Exam owns Sections/Papers/Packages).
But the **pattern** still lived nowhere: each Paper carried its own
questions/marks/duration/negative-ratio, re-entered by hand per mock, and there was
no notion of an exam having **multiple stages** (Prelims, Mains) with different
patterns. MP SI 2026 is two-stage (Prelims qualifying, no negative; Mains = 2 papers
per set, 300 marks each, negative marking), and every exam's pattern can change with
each new official notification. Re-coding or re-typing per mock doesn't scale and
drifts.

## Decision
Add **`ExamStage`** — per-exam, per-stage pattern config: `key` (PRELIMS/MAINS),
`papersPerSet`, per-paper defaults (`defaultQuestions/Marks/DurationMinutes/NegativeRatio`),
`qualifying`. A "mock" of a stage = `papersPerSet` papers grouped as one **set**.
`Paper` gains `stageId` (nullable — legacy papers stay null) plus `setNo` +
`paperNoInSet` to group a multi-paper set (a Mains set = 2 papers sharing `setNo`).

Mock creation and (Phase B) package/credit creation **read this config** — onboarding
or re-patterning an exam is editing `ExamStage`, not code. All additive/nullable, so
no backfill needed.

## Alternatives considered
- **Pattern on Paper only (status quo)** — no single source of truth; every mock
  re-typed; no stage concept; combos/mains-sets impossible to model honestly.
- **Separate Exam rows per stage** (`mp-si-prelims`, `mp-si-mains`) — reuses the exam
  machinery but splits one real exam into two, complicates the landing/default-exam
  and cross-stage combos; rejected in favour of stages within one exam.
- **Full generic rules engine** — over-general; the domain is exam-mock-shaped.

## Consequences
- **Good:** one place per exam defines its shape; mocks seed from it; Mains sets are
  first-class; combos (Prelims+Mains) become expressible once credits are stage-scoped.
- **Cost / follow-ups (Phase B, money-touching — see [[Business-Rules]]):**
  (1) `UserCredit` needs a `stage` dimension so credits are per user×exam×**stage**;
  (2) `Package` should grant `{prelimsCount, mainsCount}` (combo = both > 0);
  (3) attempt/entitlement must treat a Mains **set** (2 papers) as one unit;
  (4) config-driven mock-creation UI (defaults pulled from the stage).
- Needs a `prisma db push` on deploy (adds `exam_stages` + Paper columns).

## Related
[[0001-config-driven-exams]] · [[combo-cross-exam-bundles]] · [[mp-si-packages-and-e2e]] ·
`../prisma/schema.prisma` (ExamStage/Paper) · `../prisma/seed-mp-si.ts`
