# Product

## One line
A realistic online **mock-test platform for Indian competitive exams**, evolving
into a **marketplace where teachers sell their own mocks under their own name** and
the platform takes a revenue share.

## The problem
Candidates for state government exams (starting with **MP Patwari**, then **MP TET
Varg 2/3**) sit a computer-based test for the *first time* on exam day — unfamiliar
interface, timer pressure, section navigation. That unfamiliarity costs marks that
preparation alone can't recover.

## The product
- A **free full-length mock** on the real exam-like interface (timer, sections,
  fullscreen, instant scorecard) — no card details, low-friction phone-OTP signup.
- Paid **packages** (5 / 10 / 20 tests) that unlock more mocks once the free test
  converts the user.
- **Instant section-wise analysis** and comparison so each attempt guides the next.

## The pivot: teacher marketplace ("YouTube for mocks")
The platform has no audience or trust of its own; **teachers do**. So teachers
(coaching partners, popular subject educators) become **tenants**: they create mocks
*within a platform-owned exam*, sell them under their **own storefront and name**,
run their **own coupon codes**, and see **their own students and revenue**. The
platform curates who joins, owns the exams and the engine, and takes a cut.

- Platform **owns exams**; tenants **build within** them (they cannot create exams).
- Recruiting good teachers is a **sales task**, not more code — the code exists to
  make a curated teacher productive on day one.

See [[Decisions/0002-tenant-marketplace-model]].

## Who it's for
- **Students** — aspirants for MP Patwari / MP TET and similar state exams, mostly
  Hindi-first, often on mobile, price-sensitive (packages ₹99–₹299).
- **Teachers / coaching partners (tenants)** — curated educators who bring their own
  audience and author mocks.
- **Platform operators (admin)** — the founder + trusted staff (data-driven roles:
  admin, sub-admin, and later sales/marketing/finance).

## Bilingual by design
Hindi-first UI with English/Hindi toggle; questions carry both languages
(`text`/`textAlt`), except language-skill sections (General Hindi/English) where
translating would defeat the point.

## What this product is **not**
- Not affiliated with any exam board (MPESB/MPPEB etc.) — an independent practice
  platform; every public surface says so.
- Not a content/courses/video platform — it is **mock tests** and their analysis.
- Not a generic "any exam type" engine — exams are onboarded by **config, not code**,
  but the domain is deliberately exam-mock-shaped.

## North-star & success signals
- Free-test → paid-package **conversion rate**.
- Number of **active curated teachers** and their student/revenue traction.
- Repeat practice (attempts per paying student).

## Related
[[Requirements]] · [[Current-State]] · [[Roadmap]] · [[Business-Rules]]
