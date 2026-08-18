# Architecture

## Stack
- **Next.js 16** (App Router, React 19, Turbopack) — one app serves UI **and**
  backend. No separate API server.
- **TypeScript** throughout; **Zod** for input validation.
- **Prisma 6** ORM → **PostgreSQL**. Pooled `DATABASE_URL` for runtime, `directUrl`
  (`DIRECT_DATABASE_URL`) for migrations/`db push` (a transaction-mode pooler can't
  run migrations). See `../docs/scaling-foundation.md`.
- **Groq** for AI question generation; **`xlsx`** for Excel import.
- **Razorpay** (payments), **MSG91/Twilio** (SMS OTP), email provider (receipts).
- **Deploy**: Docker Compose on one VPS (app + Postgres + Caddy). See
  [[Decisions/0005-lean-vps-deployment]].

## Layers (where things live under `../src`)
```
app/                Next.js routes (pages + route handlers)
  (public pages)    /, /login, /packages, /teachers, /t/[slug], /mp-tet-varg-2/*, …
  dashboard,exam,…  student app (protected)
  admin/(protected) admin console (separate auth)
  api/              route handlers: exam engine, google auth, razorpay webhook
  actions/          "use server" server actions (the real write API)
lib/                domain logic — the heart of the app, framework-light
  auth/             sessions, OTP, google, password, crypto, permissions, sms
  exam/             entitlement, scoring, finalize, shuffle, reaper, report, import
  payments/         razorpay, creditOrder, coupon
  billing/          tax, earnings (merchant-of-record)
  ai/               groq, translate
  email/, security/, seo/
  prisma.ts, tenant.ts, rateLimit.ts
proxy.ts            edge middleware (optimistic auth gate + acquisition capture)
prisma/schema.prisma  the data model (source of truth for the DB)
```

## Two separate identity systems
- **Students** = `User` — phone/Google login, **single active session**, exam-idle
  semantics. Cookie: `mpp_session`. Logic in `lib/auth/session.ts`.
- **Admins/teachers** = `AdminUser` — email+password, data-driven `Role`, optional
  `tenantId`. Separate cookie/session (`lib/auth/adminSession.ts`). Never share the
  student auth path.

`proxy.ts` does **optimistic** cookie-presence gating only; the real DB-backed check
happens in `verifySession()` / `getAdminSession()` on each protected page/route.

## Request flow (typical write)
1. Client calls a **server action** in `app/actions/*` (or a route handler in
   `app/api/*` for the exam engine / webhooks).
2. Action verifies session (`verifySession` / `getApiSession` / `requirePermission`)
   and validates input with **Zod**.
3. Domain logic in `lib/*` runs the rule (often inside a Prisma **transaction** for
   anything touching money or attempts).
4. Prisma writes; `revalidatePath` refreshes affected Server Components.

## Data model (Prisma) — the shape
Full schema: `../prisma/schema.prisma`. Core entities:

- **Exam** → **Section**, **Paper** → **Question** → **QuestionOption**. Exams are
  seeded config; new state exams are onboarded by data, not code.
- **Attempt** → **Answer** — a student's run of a paper. `questionOrder`/`optionOrder`
  are per-attempt shuffles (anti-cheat). Terminal statuses: submitted/expired/locked.
- **Package** → **Order** → **UserCredit** — the commerce spine. Credit is keyed
  `(userId, examId, tenantId)`; an order credits exactly that bucket.
- **Coupon** — discount + optional influencer commission.
- **Tenant** — a teacher/coaching partner. The platform itself is the fixed tenant
  `"platform"` (`PLATFORM_TENANT_ID`) so every ownable row has a **non-null owner**
  and checks never special-case null. `Paper/Package/Order/UserCredit` carry
  `tenantId` (default `"platform"`).
- **Enrollment** — student "follows"/belongs to a tenant (many-to-many).
- **Role** (data-driven RBAC) + **AdminUser** + **AdminSession**.
- **PayoutStatement** — teacher earnings (gross→commission→TDS→net).
- **SequenceCounter** — gap-free invoice numbers (atomic within the crediting tx).
- **RateLimitCounter**, **OtpChallenge**, **Session**, **ContentUpload**.

## Multi-tenancy model
- Platform **owns exams**; tenants **build within** them and cannot create exams.
- Every tenant-ownable row has a `tenantId`; listings/actions scope by it via
  `tenantScopeWhere()` / `canActOnTenant()` / `actorTenantId()` in
  `lib/auth/permissions.ts`.
- Credits and attempts are isolated per tenant — a teacher's credits can't be spent
  on another tenant's papers. See [[Business-Rules]] and
  [[Decisions/0002-tenant-marketplace-model]].

## RBAC model
Permission **keys** cataloged in `lib/auth/permissions.ts` (`PERMISSIONS`). Roles are
**rows** bundling keys; `admin` holds `"*"`. `scope` (platform|tenant) decides
visibility breadth. Guards: `requirePermission` (throws), `checkPermission` (returns
`{error}`), `requirePagePermission` (redirects). See
[[Decisions/0003-data-driven-rbac]].

## Concurrency & correctness spine (read [[Business-Rules]] before editing)
- **Atomic credit decrement**: conditional `updateMany(WHERE testsRemaining > 0)` —
  can never go below 0 (`lib/exam/entitlement.ts`).
- **Idempotent crediting**: single choke point `creditOrderForPayment()` flips
  `Order.status created→paid` + increments credit in **one transaction**; duplicate
  webhooks dedupe on status (`lib/payments/creditOrder.ts`).
- **Race-safe finalise**: `finalizeAttempt()` is the only writer of score/terminal
  status; conditional flip means the loser reads back the score, never rescoring
  (`lib/exam/finalize.ts`).
- **Single session**: idle-window conflict check in `lib/auth/session.ts`.

## Cross-cutting
- **Security**: hashed OTP codes & session tokens (`lib/auth/crypto.ts`), same-origin
  checks (`lib/security`), fail-closed Razorpay signature verification, no prod Swagger.
- **Rate limiting**: DB-counter based (`lib/rateLimit.ts`) for OTP/login/question serving.
- **Acquisition attribution**: `proxy.ts` captures `utm_*` on first touch → stamped
  on the `User` at signup (`signupSource/Medium/Campaign`).
- **i18n / multi-language**: **foundation for N languages** —
  `Language` (data), `QuestionTranslation` / `OptionTranslation` (per-lang, keyed
  `[*, lang]`), `Paper.sourceLang`; read via `lib/i18n/resolveQuestion()` with
  source fallback. Pre-translate once at publish, cached (phase-2 pipeline).
  See [[Decisions/0006-multi-language-content]]. (Legacy `text`/`textAlt` +
  `lib/ai/translate.ts` bilingual path still present; migrates to the table.)
  Language-skill sections (General Hindi/English) are never translated.

## Related
[[Current-State]] · [[Business-Rules]] · [[Requirements]] · `Decisions/`
