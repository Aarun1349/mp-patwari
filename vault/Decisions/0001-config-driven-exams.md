---
status: accepted
date: 2026-07
tags: [decision, data-model, exams]
---

# 0001 — Onboard exams by config, not code

## Context
The product started as a single hardcoded MP Patwari mock (`../docs/specs.txt`
deliberately chose a flat, Patwari-specific shape to ship fast). But the real
opportunity is many state exams (MP TET, and beyond). Re-coding per exam doesn't
scale.

## Decision
Model exams as **data**: an `Exam` row owns its `Section`s, `Paper`s, `Package`s and
`UserCredit`s. Adding a new exam (MP TET, SSC, …) is seeding config, **not** writing
code. Content and pricing hang off `Exam`.

## Alternatives considered
- **Keep it Patwari-hardcoded** — fastest, but a dead end for the multi-exam / teacher
  vision.
- **Generic "any quiz type" engine** — over-general; the domain is specifically
  exam-mock-shaped (sections, negative marking, fullscreen), so a generic abstraction
  would add cost without payoff.

## Consequences
- **Good:** new exams are an ops task; the engine stays one codebase.
- **Cost:** section/marking assumptions are exam-mock-specific by design.
- **Follow-ups:** grow MP TET banks (see [[Roadmap]]).

## Related
`../prisma/schema.prisma` (Exam/Section/Paper) · [[Architecture]] · [[Product]]
