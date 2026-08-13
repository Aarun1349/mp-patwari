---
status: accepted
date: 2026-07
tags: [decision, payments, concurrency]
---

# 0004 — Idempotent money & race-safe attempts

## Context
Razorpay delivers webhooks **at least once**, and the client-side confirm can race the
webhook. Naively crediting on either path double-credits. Separately, an exam attempt
can be finalised from four places at once (submit, heartbeat, violation-lock, reaper)
— naive scoring double-scores or corrupts.

## Decision
- **One crediting choke point** `creditOrderForPayment()`: a conditional
  `updateMany(WHERE status='created' → 'paid')` gates the credit; if 0 rows flip, it's
  a duplicate and returns without crediting. The status flip **and** the credit
  increment share **one transaction** (a customer paying with nothing credited is
  worse than the double-credit we're preventing). Postgres row locks serialise
  concurrent fires.
- **Atomic credit decrement** on attempt start: `updateMany(WHERE testsRemaining > 0,
  decrement 1)` — can't go negative.
- **One finalise writer** `finalizeAttempt()`: conditional flip from
  in_progress/paused → terminal; the loser of a race reads back the already-computed
  score instead of rescoring.

## Alternatives considered
- **Dedupe by storing processed webhook ids** — extra table/state; the `Order.status`
  transition already *is* the dedupe key, and it's the thing we must update anyway.
- **App-level locks / mutexes** — don't survive multiple app instances; DB-level
  conditional writes do.

## Consequences
- **Good:** safe under duplicate webhooks, confirm/webhook races, concurrent starts,
  and concurrent finalises — without a distributed lock.
- **Cost:** the max-attempts cap is deliberately a softer read-then-write (no money at
  stake), so a rare race could allow one extra attempt — accepted.
- **Follow-ups:** none; treat these three functions as 🔒 in [[Business-Rules]].

## Related
`../src/lib/payments/creditOrder.ts` · `../src/lib/exam/entitlement.ts` ·
`../src/lib/exam/finalize.ts` · [[Business-Rules]]
