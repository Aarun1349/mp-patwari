# Requirements

Derived from the current implementation and the original spec (`../docs/specs.txt`).
`[✓]` = built and running today · `[~]` = partial / config-gated · `[ ]` = planned.

## Functional — Student

- `[✓]` **Auth**: passwordless phone **OTP** signup/login; **Google OAuth** sign-in.
- `[✓]` **Single active session** per account (idle-window based) — no shared logins.
- `[✓]` **Profile CRUD** — all fields optional, never gate access.
- `[✓]` **Free mock** — one free full-length test without payment.
- `[✓]` **Exam engine** — countdown timer, section navigation, question/option
  shuffle, fullscreen, anti-cheat (blur/visibility/fullscreen-exit → flag/lock),
  auto-submit on expiry, resume of an in-progress attempt.
- `[✓]` **Instant scorecard** — score, accuracy, section-wise report.
- `[✓]` **Packages & purchase** — Razorpay checkout; credits unlock more tests.
- `[✓]` **Coupons** — percent/flat discount; ₹0-after-coupon path; influencer
  attribution + commission.
- `[✓]` **Purchase & practice history**, **invoice** view.
- `[~]` **Email receipts** — code path exists; provider config-gated.
- `[~]` **SMS OTP delivery** — MSG91 path in code; live delivery gated on DLT approval.

## Functional — Marketplace (teachers/tenants)

- `[✓]` **Tenant model** — teacher storefront (`/t/[slug]`), branding, revenue share.
- `[✓]` **Tenant-scoped content** — papers/packages/questions owned by a tenant.
- `[✓]` **Credit isolation** — credits scoped to `(user, exam, tenant)`.
- `[✓]` **Auto-enrolment** — buying a teacher's package enrols the student with them.
- `[✓]` **Payout statements** — gross → commission → TDS → net (draft/approved/paid).
- `[~]` **Storefront discovery** — `/teachers` listing; polish + purchase-wiring ongoing.

## Functional — Admin / RBAC

- `[✓]` **Separate admin identity** (email+password), independent of student auth.
- `[✓]` **Data-driven RBAC** — roles are rows, not an enum; permission-key catalog;
  `admin` holds `"*"`. Platform vs tenant scope. See [[Decisions/0003-data-driven-rbac]].
- `[✓]` **Admin surfaces** — users, exams, papers, questions, packages, coupons,
  orders, attempts, tenants, payouts, earnings, billing, acquisition analytics.
- `[✓]` **Content ingest** — Excel upload; AI-generated questions (Groq).
- `[✓]` **Question editing** — fix typos/wrong options per question.
- `[~]` **Open-scope future roles** — sales/marketing/finance addable as data (no schema change).

## Non-functional

- `[✓]` **Tenant isolation** — every query scoped by owner; no cross-tenant leakage.
- `[✓]` **Money is idempotent** — webhook/confirm can't double-credit or double-charge.
  See [[Business-Rules]].
- `[✓]` **Concurrency-safe** — atomic credit decrement, race-safe attempt finalise.
- `[✓]` **Rate limiting** — OTP send/verify, login, question serving.
- `[✓]` **Security posture** — hashed OTPs/tokens, same-origin checks, no prod Swagger,
  fail-closed webhook signature verification.
- `[✓]` **Bilingual (hi/en)** content and UI.
- `[~]` **Cost-predictable hosting** — lean single-VPS (fixed ~₹1,000–1,150/mo).
  See [[Decisions/0005-lean-vps-deployment]].
- `[~]` **GST/tax** — merchant-of-record billing fields exist; tax **OFF** until a CA
  signs off (`GST_RATE_BPS` unset).
- `[ ]` **Connection pooling at scale** — schema has `directUrl`; PgBouncer to be
  enabled when concurrency grows. See `../docs/scaling-foundation.md`.

## Explicitly out of scope (now)
- Native mobile apps; live classes/video; generic non-exam quizzes; unofficial
  WhatsApp automation; any invented external API.

## Related
[[Product]] · [[Current-State]] · [[Business-Rules]] · [[Architecture]]
