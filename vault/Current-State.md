# Current State

_Snapshot as of 2026-08-20. Update this whenever what-exists changes._

## Status in one line
**Live in production** at https://examsexpress.in on a self-managed AWS Lightsail
(Mumbai) VPS. The full tenant/RBAC/billing marketplace is deployed. A few
integrations are **config-gated** (not code-blocked): SMS OTP delivery, Google
OAuth, and Razorpay LIVE keys.

## What runs today

### Student flow (end to end) ✅
Signup (phone OTP / Google) → profile → dashboard → free full-length mock on the
real exam-like interface (timer, sections, shuffle, fullscreen, anti-cheat,
auto-submit, resume) → instant scorecard + section-wise report → buy a package
(Razorpay) → credits unlock more mocks → purchases/history/invoice.

### Marketplace ✅ (deployed; recruitment is the open work, not code)
Tenants (teachers) with storefronts, tenant-owned papers/packages/questions, credit
isolation per `(user, exam, tenant)`, buy-a-package auto-enrols the student, payout
statements (gross→commission→TDS→net). **Storefront subdomains are LIVE** (2026-08-20):
`<slug>.examsexpress.in` over valid HTTPS via Caddy on-demand TLS +
`/api/verify-domain` (active tenants only); `/t/[slug]` is the internal route the
subdomain rewrites to (and the link form used in local dev). Buy page leads with our
own **Official** packages, then explore-by-exam and by-teacher sections. New teachers
are `isActive:true` by default (no "Live" toggle in the onboard form yet).

### Admin + RBAC ✅
Separate admin auth; data-driven roles (`admin` = `"*"`, plus sub_admin/partner/
creator, and room for sales/marketing/finance as data). Admin manages users, exams,
papers, questions, packages, coupons, orders, attempts, tenants, payouts, earnings,
billing, and acquisition analytics. Content via Excel upload + AI (Groq) generation.

### Content live
- **MP Patwari** exam seeded (6 sections). ~100-question bank uploaded.
- **MP TET Varg 2** SEO/landing pages (`/mp-tet-varg-2/*`) + a free Maths mock
  (50 hand-verified questions) — target exam, subject-teacher review still pending.

## Deployment (see [[Decisions/0005-lean-vps-deployment]])
- **AWS Lightsail Mumbai**, static IP `13.202.164.83`, Ubuntu 24.04.
- **Docker Compose** stack at `/opt/examsexpress/deploy`: Next.js standalone app +
  internal Postgres (not internet-exposed) + Caddy (auto-HTTPS via Let's Encrypt).
  4 GB swapfile for builds. Secrets in `deploy/.env` (gitignored).
- **Deploy/update**: SSH → `cd /opt/examsexpress/deploy` → `git pull` →
  `docker compose up -d --build`. Schema/seed via the `migrate` service
  (`docker compose --profile tools run --rm migrate`).
- **DNS on Netlify**: apex + `www` A-records → the Lightsail IP. (Migrated off
  Railway on 2026-07-21 after its free trial ran out and the site 404'd.)
- The sandbox **cannot** reach the prod DB (egress limited to 80/443); DB/migration
  commands run from the user's own terminal.

## Config-gated (code done, waiting on external setup)
| Item | Blocker | Where |
|---|---|---|
| **SMS OTP delivery** | MSG91 DLT template approval | `../src/lib/auth/sms.ts` (falls back to `[dev-otp]` console log) |
| **Google OAuth** | add redirect URI in Google Console + set `GOOGLE_CLIENT_ID/SECRET` in `.env` | `../src/lib/auth/google.ts` |
| **Razorpay LIVE** | KYC address-proof (bank statement being submitted) | `../src/lib/payments/razorpay.ts` |
| **Email receipts** | email provider config | `../src/lib/email/sendReceipt.ts` |
| **GST/tax** | CA sign-off; `GST_RATE_BPS` unset → tax = 0 | `../src/lib/billing` |

## Tech snapshot (see [[Architecture]])
Next.js **16** (App Router, React 19, Turbopack), TypeScript, Prisma **6** + PostgreSQL,
Zod, `xlsx`, Groq (AI question gen). No separate backend — server actions + route
handlers. Auth is custom (hashed OTP/session tokens), no NextAuth.

## Known gaps / rough edges
- Storefront → purchase wiring and `/teachers` discovery need polish.
- `README.md` is still the default create-next-app boilerplate.
- MSG91 SMS path needs the country-code `91` prefix (already applied in `sms.ts`).
- Connection pooling (PgBouncer) is scaffolded (`directUrl`) but not yet enabled.

## Related
[[Product]] · [[Requirements]] · [[Roadmap]] · [[Architecture]] · [[Business-Rules]]
