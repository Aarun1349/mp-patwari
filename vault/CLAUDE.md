# ExamsExpress — Documentation Vault

This vault is the **single source of truth** for product intent, architecture, and
decisions on ExamsExpress. It exists so that any AI assistant (or human) can get
fully oriented from these files alone, without re-reading the whole codebase.

The code lives one level up (`../src`, `../prisma`). This vault describes **why**
the code is the way it is and **what** it is meant to do. When they disagree, the
code is the truth about *what runs* — but a disagreement is a signal to update one
of them, not to ignore it.

## The map

| File | What it answers | Read it when |
|---|---|---|
| [[Product]] | What are we building and for whom? | Starting anything; framing a feature |
| [[Requirements]] | What must the system do? (functional + non-functional) | Scoping work, checking "is this in scope?" |
| [[Current-State]] | What actually exists and runs today? | Before estimating; before saying "add X" |
| [[Architecture]] | How is it built? (stack, layers, data model, request flow) | Touching code; deciding where something goes |
| [[Business-Rules]] | The exact rules that must never silently break | Editing exam/credit/payment/auth logic |
| [[Roadmap]] | What's next and in what order? | Prioritising; planning a session |
| `Decisions/` | Why we chose X over Y (ADRs) | Before re-opening a settled decision |
| `Features/` | One note per feature being designed/built | Planning or tracking a feature |
| `Bugs/` | One note per tracked bug | Reporting or fixing a defect |
| `Tasks/` | Short-lived actionable work items | Breaking down a chunk of work |

## How to use this vault (for AI assistants)

**At the start of a task**, read in this order: [[Product]] → [[Current-State]] →
the specific doc for your area ([[Architecture]] or [[Business-Rules]]). Skim
`Decisions/` for anything touching your area.

**Before writing code:**
- Check [[Business-Rules]] if you are anywhere near exam attempts, credits,
  payments, sessions, or tenant isolation. These rules are load-bearing and
  several are protected by subtle concurrency logic — do not "simplify" them
  without reading the linked ADR.
- Check [[Current-State]] so you don't propose building something that exists.

**After making a change**, update the docs in the same change:
- New capability → update [[Current-State]] and, if it shifts direction, [[Roadmap]].
- A choice with trade-offs (a library, a schema shape, a security posture) →
  add a `Decisions/` ADR from the template. One decision per file.
- A new bug found → add a `Bugs/` note. A new feature scoped → a `Features/` note.

**Keep it concise.** These are working documents, not a wiki to admire. Prefer a
table or a bullet list over prose. Link with `[[wikilinks]]` liberally — a link to
a note that doesn't exist yet is a valid TODO marker.

## Ground rules

- **Do not modify application code from documentation tasks.** This vault is
  descriptive. Code changes are separate, deliberate acts.
- **Money and exams are sacred.** Any rule in [[Business-Rules]] tagged 🔒 has a
  correctness/concurrency reason behind it. Read the reason before you touch it.
- **Convert relative dates to absolute** (e.g. write `2026-08` not "next month")
  so notes stay true when read later.
- **Templates** live as `_TEMPLATE.md` in each folder. Copy, rename, fill in.

## Conventions

- Filenames: `Title-Case-With-Hyphens.md` for top-level docs; ADRs are
  `NNNN-short-slug.md` (zero-padded, monotonic).
- Every ADR, Feature, Bug, and Task note carries YAML frontmatter (`status`,
  `date`, `tags`) so they can be filtered.
- Statuses: `proposed` · `accepted` · `superseded` (decisions); `planned` ·
  `in-progress` · `done` · `blocked` (features/tasks); `open` · `fixed` ·
  `wontfix` (bugs).
