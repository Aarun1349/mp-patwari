# Roadmap

_Direction, not a contract. Ordered by what unblocks revenue soonest. Update as
priorities shift; move shipped items to [[Current-State]]._

## Now — unblock live payments & first teachers (2026-08)
- [ ] **Razorpay LIVE** — clear KYC address proof (bank statement in proprietor's
  name being submitted) → set LIVE keys in `deploy/.env`.
- [ ] **SMS OTP** — after MSG91 **DLT** template approval, set
  `MSG91_AUTH_KEY`/`MSG91_TEMPLATE_ID`; verify the `91` country-code path.
- [ ] **Google OAuth** — add prod redirect URI in Google Console; set
  `GOOGLE_CLIENT_ID`/`SECRET`.
- [ ] **Rotate** any secrets that were shared in plaintext during setup.
- [ ] **Recruit 5–10 curated teachers** (a sales task, not code) — the marketplace
  code is deployed; it needs supply.

## Next — make a teacher productive day one
- [ ] Polish **storefront → purchase** wiring and `/teachers` discovery.
- [ ] Tenant onboarding UX (create tenant, brand it, first package) end-to-end check.
- [ ] Subject-teacher **review of the MP TET Maths mock** (50 Qs) before promoting.
- [ ] Replace default `README.md` with real dev setup + a pointer to this vault.

## Soon — content & growth
- [ ] Grow the **MP TET Varg 2/3** question banks; more full-length mocks.
- [ ] **Blog/SEO** surface (permission key `blog.manage` already exists).
- [ ] Acquisition analytics review (utm attribution already captured).
- [ ] Email receipts live (provider config).

## Later — scale & finance (revenue-funded, not before)
- [ ] Enable **PgBouncer** connection pooling (schema already has `directUrl`).
- [ ] Turn on **GST/tax** once a CA signs off (`GST_RATE_BPS`).
- [ ] Automate **payout statements** → actual disbursement flow.
- [ ] Open-scope roles: **sales / marketing / finance** (add as data when needed).
- [ ] Second exam vertical / the broader "one exam engine, many products" vision.

## Guardrails while moving fast
- Don't touch a 🔒 rule in [[Business-Rules]] without an ADR.
- Onboard new exams by **config**, not code.
- Keep hosting cost **fixed and predictable** (see
  [[Decisions/0005-lean-vps-deployment]]).

## Related
[[Product]] · [[Current-State]] · [[Requirements]]
