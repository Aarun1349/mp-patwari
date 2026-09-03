---
type: reference
date: 2026-09-03
last_verified: 2026-09-03
tags: [reference, exams, catalog, mpesb, mppsc, config]
source: "founder research doc — MP_Exams_2026_Exams_Express_Master_Database.md"
---

# MP Exams 2026 — catalog status tracker

Blueprint = the founder's research doc. **Rule (from the doc): never encode exact
question/marks/duration/negative-marking from research alone — validate against the
current official MPESB/MPPSC rulebook/advertisement before creating & activating a
real mock.** Structure (exam + stages + subjects) is scaffolded config-driven; exact
patterns stay TENTATIVE/TBD here until validated.

Status vocab: `CONFIRMED` · `TENTATIVE` · `TBD` · `REVISED` · `CLOSED` · `EXAM_COMPLETED`.

| Exam | slug | Body | Stages | Pattern status | Priority | Key dates |
|---|---|---|---|---|---|---|
| MP Police SI / Subedar | `mp-si` | MPESB | Prelims + Mains (+ PET + Interview) | Prelims **CONFIRMED** (100Q/100/120min/0-neg, web-validated); Mains **TENTATIVE** (2 papers/set, 300 each, negative) | P1 | Apply 9–23 Sep; Written from 28 Oct 2026 |
| MP High Court Assistant Gr-III | `mp-hc-ag3` | MP High Court | Written + Hindi Typing skill | **TBD** — verify HC notification | P1 | Apply 17 Aug–15 Sep; exam date TBD |
| MPESB Group-3 (Sub Engineer etc.) | `mpesb-group-3` | MPESB | Written (post-dependent: Common + technical stream) | **TBD** — post-wise, verify rulebook | P1 | Apply 29 Aug–12 Sep; exam from 7 Oct 2026 |
| MPPSC State Service | `mppsc-state-service` | MPPSC | Prelims (Paper I GS + Paper II CSAT) + Mains (descriptive) + Interview | Prelims **TENTATIVE** (Paper I/II each 200/2hr, no-neg — "verify"); Mains TBD | P1 | Prelims 26 Apr; Mains 7–12 Sep 2026 |
| MPESB Group-2 Sub Gr-1 / Krishi Vistar Adhikari | `mpesb-group-2-sg1` | MPESB | Written (post-specific + agriculture) | **TBD** | P2 | Apply 3–17 Jul; exam from 17 Sep 2026 |
| MPPSC State Forest Service | `mppsc-forest-service` | MPPSC | Prelims (often shared w/ State Service) + Mains | **TBD** | P2 | Mains 27 Sep 2026 |

## Notes / rules honored (from the blueprint)
- **Stages never mixed** in one mock config (Prelims ≠ Mains ≠ Skill/Physical). Each is an `ExamStage`.
- **Group-3 is post-dependent** — do NOT build one identical technical syllabus for all posts; only the Common General section is scaffolded, technical streams (Civil/Electrical/Mechanical/Draftsman/…) added per demand.
- **MPPSC Mains is descriptive** — represented as a separate stage, not another Prelims mock. (Descriptive/written evaluation is out of the current MCQ engine's scope — flag before building Mains mocks.)
- Some MPESB 2026 cycles (Group-5 Nurse, Van Rakshak, Jail Prahari, ASI/HC Computer, ITI TO, Group-2 SG-4) are past their window — not treated as upcoming.

## Source priority (official first)
MPESB rulebook → MPESB advert/notice → MPESB student dashboard → MPPSC notification → HC notice → reputable secondary. Never an old coaching article over a revised official notice.

## Official sources
- MPESB dashboard: https://esb.mp.gov.in/student_dashboard.htm · rulebooks: https://esb.mp.gov.in/rulebooks/rule_books.htm
- MPPSC: https://mppsc.mp.gov.in/

## Scaffold state (config-driven, this repo)
- `prisma/seed-mp-si.ts` — MP SI (full: stages + sections + free Prelims mocks + Mains set draft + packages).
- `prisma/seed-mp-exams.ts` — the other 5 exams: identity + stages (structure) + subject sections only. **No mock papers, no packages** yet (patterns unvalidated). Deep-fill per exam after official validation.
