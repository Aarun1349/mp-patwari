---
status: accepted
date: 2026-08-18
tags: [decision, i18n, data-model, content]
---

# 0006 — Multi-language content (N languages)

## Context
Questions started as **bilingual** (Hindi/English): a single `Question.textAlt`
column held the "other" language, lazily machine-translated and cached. That
model only ever supports **two** languages. We want to add more (Marathi, Tamil,
…) as the platform grows, and a student should be able to take a paper in any
supported language with **no wait** at exam start.

## Decision
Model translations as **data in a normalized table**, keyed by language code, and
**pre-translate once** (cached), never per-attempt.

**Schema (foundation, this ADR):**
- `Language(code, name, nativeName, isActive, sortOrder)` — supported languages
  are rows, so a new language is enabling data, not a schema change.
- `QuestionTranslation(questionId, lang, text)` + `OptionTranslation(optionId,
  lang, text)`, each `@@unique([*, lang])`.
- `Paper.sourceLang` — the language `Question.text` / `QuestionOption.text` are
  authored in. Every other language is a translation row.
- Relations added on `Question` / `QuestionOption`.

**Read path:** `resolveQuestion(q, lang, sourceLang)` returns the text in `lang`,
**falling back to the source text** when a translation is missing — the exam
never blocks on a missing translation (`src/lib/i18n/`).

**Write / when to translate:** **pre-translate at authoring/publish time, in the
background**, cached forever and reused across all attempts and users. A teacher
sees a per-language "X pending" status (`pendingTranslationCount`). At **exam
start we serve cached rows only — no synchronous translation.**

## Alternatives considered
- **Keep `text` + `textAlt`** — only 2 languages; a dead end.
- **JSON column `{hi, mr, …}` per question** — fewer joins, but not per-language
  queryable/indexable (can't cheaply ask "which questions lack Marathi?"), and
  awkward to manage at scale. Normalized table wins for curated content.
- **Translate all questions at exam start (on-demand)** — rejected: ~500 strings
  per 100-question paper = 30s–2min wait, re-done for every attempt/user,
  expensive, rate-limited. Translate **once**, reuse.

## Consequences
- **Good:** new language = a `Language` row + a background translate pass; exam
  reads are instant (cached); source fallback means no hard failures.
- **Cost:** a background pre-translation pipeline is needed (phase 2); AI
  translation of technical/math content needs a review option for quality;
  language-skill sections (General Hindi/English) must be excluded from
  translation (as today).
- **Migration:** existing `textAlt` (Hindi) → `QuestionTranslation(lang="hi")`
  rows via a one-time script, then retire `textAlt`. Both coexist during the
  transition.

## Follow-ups (phase 2, not in this ADR)
- Background pre-translate job wired to `upsert*Translation` (reuse `lib/ai`).
- Per-language pending status in the teacher UI (replace the single Hindi one).
- Exam language picker (validated against active languages) + exam reads via
  `resolveQuestion`.
- `textAlt` → translations data migration.

## Related
`prisma/schema.prisma` (Language / QuestionTranslation / OptionTranslation) ·
`src/lib/i18n/` · [[Architecture]] · [[Business-Rules]] · [[Changelog]]
