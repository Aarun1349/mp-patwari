# Changelog

A running record of **what** changed, **why** (which finding drove it), the
**approach**, and the **files** touched. Newest batch on top. The raw list of
findings lives in [[Tasks/admin-panel-qa-batch]]; this file is the *implementation*
record with rationale.

---

## Batch 7 — Home rethemed to MP SI + OTP login hidden · 2026-09-02 · branch `local-test-one` (pushed master + multiexam-platform)

**Context.** MP SI / Subedar 2026 is the active wave (MPESB notification out,
applications from 9 Sept), so the **root landing** (`/`) — still MP Patwari-themed
— was retargeted to MP SI. Separately, phone/OTP login is not usable in production
(MSG91 DLT template still pending approval), so it was hidden to avoid a dead path.

**Changes.**
- **`src/app/landing-content.ts`** — hero lede, stats, admit card, exam-pattern
  table, FAQ and footer rethemed MP Patwari → MP SI / Subedar Prelims. Numbers
  taken from the already-verified `/mp-si` page (`app/mp-si/msi-content.ts`):
  100 questions / 100 marks / 120 min / **no negative marking**, CBT, qualifying,
  board **MPESB** (`esb.mp.gov.in`). Kept honest — subject-wise split points to the
  official notification rather than inventing weightage.
- **`src/app/LandingClient.tsx`** — admit-card tag `#MP-PTW` → `#MP-SI`.
- **`src/app/login/page.tsx`** — divider + `<LoginForm />` (phone OTP) commented
  out; Google is the only visible method. `google_not_configured` copy no longer
  refers users to the hidden mobile option. Backend OTP code (`lib/auth/otp.ts`,
  `sms.ts`, `actions/auth.ts`) untouched — re-enable = uncomment.

**Verified.** `npm run build` clean (exit 0). Committed `626b068`.

**Still MP-Patwari-worded (not in this pass, flagged):** `app/about/about-content.ts`,
`lib/ai/groq.ts` (AI-gen prompt), `lib/exam/defaultExam.ts`. Home + admit card done.

---

## Batch 5 — P0 production-hardening (started) · 2026-08-20 · branch `local-test-one` (pushed master + multiexam-platform)

**Context.** After the launch recap, started the **P0 "before real money/scale"
robustness track**: backups, payment-idempotency verification, monitoring hooks, and
rate-limiting. Commits ~`6c1c7c7` → `8d3cdb3`. Comms/payments pivots (Razorpay→PayU,
WhatsApp/Meta, official emails) are captured for later — not built this batch.

**💰 Payment idempotency — audited, solid (no fix needed).** `creditOrderForPayment`
(the single choke point for both the webhook and the client confirm path) flips
`Order.status created→paid` with an atomic `updateMany` **inside** the credit
transaction; `flip.count===0` ⇒ skip. This dedupes webhook-retry, confirm-before-webhook,
and concurrent firing (Postgres row-lock). Webhook verifies HMAC; the client fast-path
verifies session **and** `verifyPaymentSignature` — no self-credit. *Still to add:
automated idempotency tests + a reconciliation job (Razorpay captured ↔ orders ↔ credits).*

**💾 DB backups — off-site + restore drill.** `deploy/backup.sh` already dumped locally;
added **rclone off-site sync** (env-gated `BACKUP_RCLONE_REMOTE`) + a gzip/size
**integrity guard** so a truncated dump never replaces good ones. New `deploy/restore.sh`
= monthly **restore DRILL** (restores newest dump into a scratch DB, sanity-checks,
drops it — prod untouched). New `deploy/BACKUPS.md` = 3-layer strategy (nightly
dump+off-site · Lightsail snapshots · restore drill) + real disaster-recovery steps.
Added `.gitattributes` (`*.sh eol=lf`) so a Windows checkout can't break bash on the server.

**🩺 Uptime — `/api/health`.** New route runs `SELECT 1` against Postgres and returns
200/503 (never cached) so an uptime monitor catches a DB outage, not just a live HTTP port.

**🚦 Rate-limiting — per-IP added.** The DB-backed fixed-window limiter (`checkRateLimit`,
atomic INSERT…ON CONFLICT) already capped OTP send/verify, admin login, order-create and
the exam engine — but every key was per-identifier, so one IP rotating through many phone
numbers slipped every per-phone cap and burned SMS money. Added per-IP gates: OTP send
20/15min, OTP verify 30/15min, admin login 15/15min. IP via new `getClientIp()`
(Caddy `x-real-ip`/`x-forwarded-for`); skipped on "unknown". No schema change.

**⏳ Pending — YOUR setup (server/consoles):** rclone remote (R2/B2) + `BACKUP_RCLONE_REMOTE`
+ cron + Lightsail auto-snapshots (see `deploy/BACKUPS.md`); an uptime monitor pointed at
`/api/health`; a Sentry account → DSN (then I wire it). **Pending — my code:** Sentry
wiring, payment idempotency tests + reconciliation job, and the Founder Dashboard + daily
pocket digest. See memory `examsexpress-deploy-state`.

---

## Batch 4 — Student reskin, subdomain storefronts LIVE, mobile + admin polish · 2026-08-19/20 · branch `local-test-one` (pushed master + multiexam-platform)

**Context.** Extended the purple design system from admin to the **student/public
surface**, restructured the buy page for the marketplace, and took the **tenant
storefront subdomains live in production**. Then a screen-by-screen mobile pass.
Commits ~`a3d014a` → `7474ff4`.

**Student / public reskin.**
- `landing.css` + `globals.css` old navy/gold/cream palette **mechanically remapped
  to purple** (same token mapping as the admin reskin). Student login brand panel,
  app shell (sidebar/topbar/off-canvas drawer via the shared `.admin-shell` frame),
  storefront — all purple now.
- Site header (landing **and** tenant storefronts) uses the **EE `BrandIcon`**
  instead of the old `ऐ` seal. All `ऐ` seal usages in JSX are gone.

**Buy page marketplace restructure** (see [[Features/packages-marketplace-restructure]]).
- Three data-driven sections: **ExamsExpress Official** (our flagship-exam packages,
  pinned top) → **Explore more exams** (our packages for other exams) → **From
  independent teachers** (non-platform packages grouped by tenant, each linking to
  the storefront). Sections 2 & 3 hide when empty. No schema change.
- **Fixed-width package cards** — `.package-grid` / `.price-grid` cap cards at 300px
  (`auto-fill` + `justify-content:start`) so a lone package no longer stretches
  full-width. Storefront coupon input styled (was bare — only `.package-card` had CSS).
- `storefrontHref()` helper: branded subdomain in prod, `/t/<slug>` in local dev
  (subdomains don't resolve on localhost; session cookies don't cross subdomains).

**Combo / cross-exam bundles** — **Phase 2 design only**, captured for later, not
built. See [[Features/combo-cross-exam-bundles]] (BundlePackage line-items,
idempotent multi-entitlement fan-out, live-exams-only). Needs an ADR before build.

**🚀 Tenant storefront subdomains LIVE in production (2026-08-20).**
`<slug>.examsexpress.in` serves the storefront over valid HTTPS. Chain: wildcard DNS
`*.examsexpress.in → 13.202.164.83` → Caddy **on-demand TLS** (`on_demand_tls { ask
http://app:3000/api/verify-domain }` + `*.examsexpress.in { tls { on_demand }
reverse_proxy app:3000 }`) → `/api/verify-domain` returns 200 only for apex/www +
**active** tenant slugs (new teacher is `isActive:true` by default — no "Live"
checkbox needed) → `proxy.ts` rewrites to `/t/<slug>`. Verified with tenant
`numero10`. **Gotcha:** if TLS handshake fails while verify-domain returns 200 →
`docker compose restart caddy` + ensure **Lightsail port 80 open** (ACME challenge).

**Mobile polish.**
- **Off-canvas sidebar drawer** — legacy `globals.css @760px` horizontal-bar rules
  broke the drawer's vertical nav; scoped them to `.app-shell:not(.admin-shell)`.
- Student `AppSidebar` + admin `AdminSidebar` made self-contained (own drawer +
  desktop **collapse shutter**, persisted). Hamburger **hidden while drawer open**
  (was covering the EE logo) + a **close (X) button** in the drawer brand row.
  Hamburger is a solid purple `#6366f1` button; icons bumped to 26px; close is
  light `#ece9ff`.
- Landing header no longer overflows at 360px (compact nav ≤600px). Login language
  toggle no longer overlaps the brand mark. Exam **result** stat cards no longer
  overflow (`min-width:0` + ≤480px shrink); `result.css` remapped to purple.

**Admin.**
- **Full-width tables** — `.admin-content .report-table` fills the card
  (`width:100%` + nowrap cells) on desktop, scrolls horizontally on mobile
  (verified: fills at 900px, scrolls at 320px).
- **User detail** profile card left-aligned so it lines up with the full-width
  Recent Attempts / Orders below.

**⚠️ Still NOT satisfying the user (paused 2026-08-20, "kal fir retry").** Sidebar
**toggle-button icons** and the **admin users / single-user pages** — the user says
these still aren't right after several attempts. Blocker: these shells are
auth-gated and the review browser has no session, so changes were compile-/CSS-tested
but never seen rendered. Next time: get a fresh **post-deploy** screenshot or a way
to log in. Tracked in memory `examsexpress-mobile-admin-polish-pending`.

---

## Batch 3 — Admin QA fixes + multi-language foundation · 2026-08-18 · branch `local-test-one`

**Context.** Continued the screen-by-screen admin polish and, on the founder's
call, laid the **data-model foundation for N-language content** (not just Hi/En) —
because the schema is the hardest thing to change later. Full multi-language
pipeline/UI is phase 2; see [[Decisions/0006-multi-language-content]].

**Admin polish (this batch).**
- **Package price money bug** already fixed in batch 1; **package + paper + question
  + upload + teacher-onboard forms** migrated to the design system (2-column grids,
  purple buttons, token controls).
- **Paper limits** (front + backend Zod): duration ≤ 180, negative marking ≤ 0.50,
  total questions ≤ 300. Teacher revenue share ≤ 70% (front + backend).
- **Marks & negative are derived from the paper** (not per question) — in the
  add/edit form AND the spreadsheet importer; fixes the "0.25 negative on a
  no-negative paper" correctness bug. (Existing uploaded rows still hold their old
  values — a one-time reconcile is offered.)
- **Questions list pagination** — 10/page with numbered buttons (1 2 … 10, Prev/Next,
  active highlighted).
- **Paper detail redesigned** to a two-column layout (sticky settings panel + wide
  questions list) — fixes the centred-float/empty-left alignment.
- **Edit Question as a modal** via Next.js intercepting routes (`@modal` slot); direct
  URL still renders the full page. New reusable `Modal` component.
- **Teacher storefront URL → subdomain** `<slug>.examsexpress.in` (`storefrontUrl()`
  helper, middleware rewrite, `StorefrontLink` with open-in-new-tab + copy button) +
  `/api/verify-domain` ask-endpoint for Caddy on-demand TLS. Wildcard DNS added on
  Netlify; Caddy TLS config + deploy pending. See [[Tasks/admin-panel-qa-batch]].

**Multi-language foundation (schema + service + seed).**
- Schema: **`Language`** (code/name/nativeName/isActive), **`QuestionTranslation`**
  and **`OptionTranslation`** (`@@unique([*, lang])`), **`Paper.sourceLang`**,
  relations on Question/QuestionOption. `db push` applied to the local DB.
- Seed: `Language` rows **en + hi** (active). Adding a language = a row.
- Service: **`src/lib/i18n/`** — `getActiveLanguages`, `resolveQuestion(q, lang,
  sourceLang)` (source fallback so the exam never blocks), `upsert*Translation`,
  `pendingTranslationCount`.
- Approach recorded in [[Decisions/0006-multi-language-content]] — pre-translate
  once at publish (cached), never at exam start.

## Batch 2 — Design system foundation + admin login reskin · 2026-08-18 · branch `local-test-one`

**Context / why.** The founder judged the UI unprofessional (esp. admin login +
storefront) and directed a proper design-system foundation so styling is
**consistent and DRY (no per-screen redos)** — global theme + reusable components,
theme applied to icons too. New brand direction: **purple / indigo "modern SaaS"**,
rolled out **admin + teacher first, then students** (see [[Features/ui-design-overhaul]]).

**Approach.** The project is **plain CSS (no Tailwind)**, so the "global theme" is a
set of **CSS design tokens** (custom properties) in `src/app/theme.css` — change a
token → updates everywhere. Reusable React components consume the tokens. Modern
React → composable components/hooks (not classic HOCs) for the same DRY benefit.

**What was built.**
- **`src/app/theme.css`** — token system: brand ramp (`--ee-1..5` from the shared
  palette), semantic tokens (primary `#6366F1`, primary-strong `#312E81`, surfaces,
  border, text), **project status colours** (info `#0272EA`, error `#7D0018`,
  warning `#FB2107`, detail/accent `#E99320`, success `#10B981` default), radius/
  shadow, plus reusable classes (`.ee-btn*`, `.ee-input`, `.ee-field`,
  `.ee-checkbox`, `.ee-select`, `.ee-alert*`, `.ee-spinner`, `.ee-login*`). Imported
  in `layout.tsx`.
- **`src/components/ui/`** — reusable, token-driven components: `Button`/`ButtonLink`
  (variants + `loading`), `Input`/`Textarea`/`Field`, `Checkbox`, `Select`,
  `PasswordInput` (**eye-icon** show/hide), `Alert` (error/warning/info/success),
  `Spinner`/`LoadingScreen`. Barrel `index.ts`. Icons use `currentColor` → themed.
- **Loading feature** — `Spinner` + button `loading` state + **route-level
  `admin/(protected)/loading.tsx`** (Suspense fallback shown while a page's server
  data fetches — aesthetic *and* covers real fetch latency).
- **Admin login reskin** — modern **split-screen**: purple-gradient brand panel
  (app "EE" icon + **ExamsExpress** + hero + trust points) | "Welcome back" form card
  with themed Email/Password (eye icon) + loading Sign-in button.
  Files: `admin/login/page.tsx`, `admin/login/AdminLoginForm.tsx`.

**Verified** (dev server): login renders, no console errors, eye toggle + fields
present. **Next:** roll tokens/components across the rest of admin (dashboard,
forms, tables, sidebar) then teacher screens.

---

## Batch 1 — Admin QA fixes · 2026-08-18 · branch `local-test-one`

**Context / why this batch existed.** The founder QA-ed the live `/admin` panel and
the teacher storefront and reported a stream of issues (money bug, broken/awkward
form UX, missing controls, marketplace gaps). They were all logged first in
[[Tasks/admin-panel-qa-batch]], then we implemented the **safe, high-value, no-
decision** subset here. Bigger items that need a **schema change or a design
decision** were deliberately deferred (see "Deferred" below) so we don't rush
correctness-sensitive or large changes.

**Overall approach.**
- **Log first, then batch-fix, then one deploy** — don't deploy issue-by-issue.
- **Prefer systemic fixes over per-screen patches** where safe (one CSS rule beats
  editing every page).
- **No schema changes and no scoring-logic changes in this batch** — those need an
  ADR (money/exam correctness is protected — see [[Business-Rules]]).
- **Verify every step with `npm run build`**, then verify live on a local dev server
  + admin login (prod deploy is a separate, later step).

### Changes

1. **🔴 Package price money bug — entered ₹599 saved as ₹5.99.**
   - *Why:* `Package.pricePaise` stores paise, but the form fed the raw number in as
     paise, so "599" became ₹5.99. Real money bug.
   - *How:* the form field is now **"Price (₹)"** (rupees, `step=0.01`), and the
     action converts **rupees → paise (`×100`, rounded)** on save and back to rupees
     for the edit form's default.
   - *Files:* `actions/adminPackages.ts`, `admin/(protected)/packages/PackageForm.tsx`.

2. **Slug was manual & could exceed 50 chars ("too big" error).**
   - *Why:* the exam/teacher create forms asked for the slug by hand; a long/blank/
     bad slug errored (schema max 50).
   - *How:* a client-side `slugify(name)` **auto-fills the slug from the name**,
     lowercased, non-alphanumerics → hyphens, **capped at 50**; still hand-editable
     (stops auto-syncing once edited).
   - *Files:* `admin/(protected)/exams/ExamForm.tsx`, `admin/(protected)/tenants/new/page.tsx`.

3. **Admin forms shrunk to the left (unprofessional).**
   - *Why:* create/edit form cards sat left with wasted space.
   - *How:* one global rule — `margin-inline:auto` on `.admin-content .auth-card` —
     **centres every constrained admin form** at once (no per-page edits). (Full
     2-column width redesign is deferred.)
   - *Files:* `globals.css` (+ minor width bump on the exam card).

4. **No show/hide password on admin login.**
   - *How:* added a **Show/Hide toggle** button that flips the password input between
     `password` and `text`.
   - *Files:* `admin/login/AdminLoginForm.tsx`.

5. **Teacher onboarding: create failed + no password help.**
   - *Why:* creating a teacher *with* a login required a 10+ char password but gave no
     easy way to make one, so submit errored (the founder was stuck here).
   - *How:* a **🎲 Generate** button makes a strong CSPRNG password on the form; on
     create we **email the teacher** their sign-in link + email + temp password
     (best-effort — logs to console until Resend is configured).
   - *Files:* `admin/(protected)/tenants/new/page.tsx`, `lib/email/sendTeacherWelcome.ts`,
     `actions/adminTenants.ts`.

6. **After upload: unclear result + no way to review imported questions.**
   - *How:* a **clean import redirects to the paper's questions page** with a success
     banner (`?uploaded=N`); a **partial import stays** on the form with the per-row
     error report so bad rows can be fixed and re-uploaded (valid rows already saved).
   - *Files:* `actions/contentUpload.ts`, `admin/(protected)/papers/[paperId]/page.tsx`.

7. **No "Back to list" on create forms.**
   - *How:* a consistent **"← Back to …" link** on each create form (exam, teacher,
     package, coupon, question, upload).
   - *Files:* the six `admin/(protected)/**/new` pages.

### Deferred to a later batch (and why)
Logged in [[Tasks/admin-panel-qa-batch]] but **not** done here:
- **Marks/negative → paper-level** — touches scoring correctness (a question saved
  0.25 negative on a no-negative paper). Needs an **ADR** + a data audit.
- **Per-question answer review on the result page** — larger student-facing feature.
- **`/packages` marketplace restructure** (separate platform vs teacher, filter by
  exam/teacher) — needs a design/ADR.
- **Forms 2-column width, view-question modal, questions pagination,
  preserve-input-on-error** — form refactors best done together.
- **UI/design overhaul + storefront + storefront URL scheme** — deferred by the
  founder until bugs are cleared ([[Features/ui-design-overhaul]]).

### Incident / gotcha (recorded so it doesn't bite again)
While pushing this batch, a **loose git ref got corrupted on Windows**
(`.git/refs/heads/multiexam-platform` filled with blank bytes → HEAD unresolvable).
A push with the broken ref then **deleted remote `master`**. Recovered by rewriting
the ref (`update-ref` after removing the broken file) and re-pushing to recreate
`master` at the batch commit — no commits lost. Lesson: after a push oddity, verify
`git ls-remote` before assuming success; never let a `src:dst` push run with an
unresolvable source.

### Verified (local dev server, 2026-08-18)
Logged in to `/admin`; confirmed rendered live: Show/Hide password toggle, **Price
(₹)** field, **← Back** link, centred forms. Build passes.
