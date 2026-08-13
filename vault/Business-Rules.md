# Business Rules

The load-bearing rules of the system. **🔒 = correctness/concurrency-critical**: it
has a subtle reason (money or exam integrity) and is protected by specific logic.
Read the linked file and its comments before changing it. Never "simplify" a 🔒 rule
without an ADR in `Decisions/`.

## Money & credits

- 🔒 **Crediting is idempotent.** A paid order is credited exactly once through the
  single choke point `creditOrderForPayment()`. It flips `Order.status
  created→paid` **and** increments `UserCredit` in **one transaction**; a duplicate
  Razorpay webhook (at-least-once delivery) is deduped by the status flip.
  → `../src/lib/payments/creditOrder.ts`
- 🔒 **Credit decrement can never go below zero.** Starting a paid attempt uses a
  conditional `updateMany(WHERE testsRemaining > 0, decrement 1)`; if 0 rows match,
  it's `NoEntitlementError`. Concurrent starts can't overspend.
  → `../src/lib/exam/entitlement.ts`
- **Webhook signature is fail-closed.** An unverified/invalid Razorpay signature is
  rejected — never credited. → `../src/app/api/webhooks/razorpay/route.ts`
- **₹0-after-coupon** orders skip Razorpay and are credited synchronously via
  `creditFreeOrder()` (keyed by `Order.id`, same idempotent shape).
- **Invoice numbers are gap-free and unique**, assigned at payment time from
  `SequenceCounter` inside the crediting transaction (`EE-<year>-<6 digits>`).
- **Merchant-of-record billing.** Tax defaults to **0/OFF** (`gstRateBps=0`) until
  `GST_RATE_BPS` is configured and a CA signs off. Do not turn tax on in code.
  → `../src/lib/billing`
- **Coupons**: percent (1–100) or flat (paise); optional influencer commission
  (percent of paid amount, or flat per redemption); `redemptionCount` increments
  inside the crediting transaction; `maxRedemptions` caps it.

## Credit scoping / entitlement

- 🔒 **Credit is scoped to `(userId, examId, tenantId)`.** A Patwari credit can't
  fund another exam; a credit bought from Teacher P can't be spent on Teacher Q's or
  the platform's papers. Enforced in both crediting and decrement.
- **Free papers** (`Paper.isFree`) consume **no** credit.
- **Max 5 terminal attempts per paper** (`MAX_ATTEMPTS_PER_PAPER`). An existing
  in-progress/paused attempt is **resumed**, not restarted. (This cap is a soft
  read-then-write limit, deliberately *not* strictly atomic — unlike the credit
  decrement — since no money rides on it.) → `../src/lib/exam/entitlement.ts`
- **Buying a teacher's package auto-enrols** the student with that tenant
  (`Enrollment` upsert in the crediting tx). No enrolment is created for
  platform-tenant purchases.

## Exam attempts & scoring

- 🔒 **`finalizeAttempt()` is the only writer** of `totalScore`/`accuracyPct` and the
  only thing that flips an attempt to a terminal status (submitted/expired/locked).
  A conditional flip makes it race-safe across the submit route, heartbeat
  self-finalise, violation-lock, and the reaper — the loser reads back the score
  instead of rescoring. → `../src/lib/exam/finalize.ts`
- **Scoring**: +`marks` for correct, −`negativeMarks` for wrong, **0 for
  unanswered** (skipped questions never penalise). Accuracy = correct/attempted.
  → `../src/lib/exam/scoring.ts`
- **Per-attempt shuffle**: `questionOrder`/`optionOrder` are generated at attempt
  start and frozen on the `Attempt` — anti-scraping / anti-cheat.
- **Timer is server-authoritative**: `Attempt.endsAt` is set from
  `paper.durationMinutes` at start; expiry auto-finalises (`expired`) even if the
  client never submits (heartbeat + reaper).
- **Anti-cheat**: fullscreen exit / tab-blur / visibility change are flagged; after
  the configured strikes the attempt is **locked** and finalised. Browsers cannot
  block OS-level shortcuts — this is deterrence, not a guarantee (spec acknowledged).

## Auth & sessions

- 🔒 **One active session per account.** On login, if another session was seen within
  the idle window (`SESSION_IDLE_TIMEOUT_MINUTES`, default 20), reject with
  `SessionConflictError`; otherwise stale sessions are cleared and a new one issued.
  → `../src/lib/auth/session.ts`
- **OTP codes and session tokens are hashed at rest** (never stored plaintext).
  OTPs are CSPRNG-generated; challenges expire and count attempts.
- **Sliding idle expiry**, throttled to one write/minute (the exam heartbeat polls
  often; precision to the minute is plenty against a 20-minute timeout).
- **Unverified user input is never an identity anchor.** `contactPhone` (self-
  reported) is separate from the OTP-verified `phone`; a self-reported value must
  not double as a login credential.
- **Students and admins are different identity systems** — separate models, cookies,
  and session logic. Don't cross them.

## Tenancy & isolation

- 🔒 **Every query is scoped by owner.** No cross-tenant read/write. Use
  `tenantScopeWhere()` / `canActOnTenant()` / `actorTenantId()` — a platform-scoped
  role sees all; a tenant-scoped role sees only its own rows.
  → `../src/lib/auth/permissions.ts`
- **The platform is the fixed tenant `"platform"`** (`PLATFORM_TENANT_ID`). Every
  ownable row has a non-null `tenantId` so checks never special-case null.
- **Tenants build within platform-owned exams**; they cannot create exams.
- **One domain must never corrupt another.** Removing a student must not destroy
  fees/attendance-type data; deletes are soft/archival, not hard.

## Data integrity (golden rules)

- 🔒 **Never hard-delete** a student, attempt, order, or exam record — deactivate/
  archive (`isActive`, status fields) instead.
- **Permission keys are the only thing that needs code for RBAC.** New *roles*
  (sales, marketing, finance) are added as **data**; only a new *capability* needs a
  new key + enforcement. See [[Decisions/0003-data-driven-rbac]].
- **No invented external APIs; no unofficial WhatsApp automation.**
- **Smallest safe fix** — don't refactor unrelated modules while fixing a bug.

## Related
[[Architecture]] · [[Requirements]] · `Decisions/`
