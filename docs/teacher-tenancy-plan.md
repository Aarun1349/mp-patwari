# RFC: Multi-Tenant Exam Platform ("YouTube for exam mocks")

Status: **Foundation design locked 2026-07-21** · Scope: competitive exams only (Certu/certifications OUT)
Repo: `D:\2026\papa\mp-patwari` (ExamsExpress)

## 1. Vision

ExamsExpress has no audience/trust; teachers do. Invite a curated 5–10 teachers
("tenants") to create and sell their **own** mock packages **under their own
name**. YouTube model: the platform hosts, handles money, and owns the exam
catalog; tenants bring content + brand + audience. Solves trust/traction AND the
content bottleneck in one move.

## 2. Locked decisions

1. **Platform owns exams.** Admin defines the exam catalog (e.g. "MP TET Varg 2").
   Tenants create their own papers, question banks, and packages **inside** an
   allowed exam. Tenants cannot create exams.
2. **Tenant isolation ("their own space").** A tenant's content, students, and
   revenue are scoped by `tenantId`. A tenant can only see/edit their own rows; a
   student only sees a tenant's mocks via that tenant. A tenant's mistakes never
   leak into the shared ecosystem.
3. **Certu / certifications OUT of scope.** Competitive exams only. Schema keeps
   an `Exam.type` seam for the future but builds no certification flows.
4. **Creator-first, invite-only, curated** (5–10 known teachers). Manual
   onboarding + payouts + light review; no self-serve KYC / anti-abuse yet.

## 3. Governance: who controls what

| Tenant controls | Platform (superadmin) controls |
|---|---|
| Own mocks, question bank, packages, price | The **exam catalog** (tenants build within enabled exams only) |
| Own branded storefront page | Discounts / coupons |
| Own students (via enrollment/link) | All money: collects, pays tenant share, keeps cut |
| — | Who gets in (invite-only) + approve-before-live gate |

## 3b. RBAC — data-driven (open scope)

Roles are **rows, not an enum**, so future roles (sales, marketing, finance/GST,
support) are added as data with zero schema change. `Role` has `permissions`
(string keys from the code catalog `src/lib/auth/permissions.ts`) and `scope`
(`platform` vs `tenant`). `AdminUser.roleId` points at a role; `tenantId` is null
for platform roles, set for tenant roles.

| Role | Scope | Permissions (bundle) |
|---|---|---|
| **admin** | platform | `*` — full authority |
| **sub_admin** | platform | tenant.read, tenant.onboard, student.read, order.read, grievance.manage, notification.broadcast |
| **partner** | tenant | paper.manage.own, package.manage.own, question.manage.own, student.read.own, revenue.read.own, notification.send.own |
| **creator** | tenant | question.manage.own, blog.manage |

New account default = `creator` (least privilege). Enforcement: a `requirePermission()`
guard on every admin/tenant server action (to build). Adding a capability (new key)
is code; adding a role that bundles existing capabilities is pure data.

## 4. Foundation data model (locked)

New:
```prisma
model Tenant {
  id              String   @id @default(cuid())
  slug            String   @unique          // storefront: /t/<slug>
  name            String
  ownerName       String?
  logoUrl         String?
  tagline         String?
  bio             String?
  accentColor     String?
  revenueShareBps Int      @default(0)       // tenant's share, basis points
  onboardedBy     String?                    // "self" | "sales" | admin id (dashboard split)
  approved        Boolean  @default(false)   // admin gate before content goes live
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  papers      Paper[]
  packages    Package[]
  questions   Question[]
  orders      Order[]
  credits     UserCredit[]
  enrollments Enrollment[]
}

model Enrollment {                            // student follows/enrolls with a tenant (many-to-many)
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  createdAt DateTime @default(now())
  @@unique([userId, tenantId])
}

enum AdminRole { superadmin tenant }
```

Changes to existing models:
- `AdminUser` → add `role AdminRole @default(tenant)` + `tenantId String?` (null = platform superadmin).
- `Paper`, `Package`, `Question`, `Order` → add `tenantId String?` (**null = platform-owned**).
- `UserCredit` → change unique key from `(userId, examId)` to **`(userId, examId, tenantId)`** (nullable tenantId = platform credits).
- `Exam`, `Section` → **unchanged** (platform-owned catalog).

## 5. Isolation rules (the crucial part)

- **Tenant admin:** a scope guard on every `/partner` + tenant action filters all
  reads/writes by `role`+`tenantId`. Authoring UI is filtered to platform-enabled
  exams (enforces "build within" rule).
- **Entitlement:** `src/lib/exam/entitlement.ts` grants/consumes credit keyed by
  `(userId, examId, paper.tenantId)` — a student's Ravi-Sir credits open only
  Ravi-Sir papers; platform credits (`tenantId=null`) open platform papers.
- **Order/webhook:** every `Order` records `tenantId`; the Razorpay webhook grants
  tenant-scoped `UserCredit`.
- **Student discovery:** logged-in home lists tenants ("your teacher among
  others"); a tenant's paid mocks require enrollment/purchase of that tenant.

## 6. The 2-day vertical slice (MP TET Maths only) — proves tenancy works

1. **Schema + migration**: the §4 changes. (Applied to prod from user's terminal.)
2. **Seed one demo tenant** (e.g. "Ravi Sir – Maths") under the MP TET exam.
3. **Tenant login** (`AdminUser` role=tenant, tenantId set) → scoped admin: create
   a Maths paper + package under MP TET; cannot see other tenants or edit the
   catalog.
4. **Entitlement rework**: `UserCredit` re-keyed; `entitlement.ts` + order webhook
   respect `tenantId`.
5. **Student side**: `/t/ravi-sir` storefront (their packages + mocks) → enroll →
   buy → tenant-scoped credit → take only their mock. Logged-in home lists tenants.
6. **Prove isolation**: a student holding Ravi-Sir credits cannot open another
   tenant's or the platform's paid paper.

Steps 1 & 4 touch the exam engine = highest risk; everything else is additive.

## 6c. GST + billing (Udemy-style)

Udemy is the **merchant of record**: it sells the course to the student, collects
price + tax, invoices the student under Udemy's tax identity, and pays the
instructor a revenue share. We should mirror that.

**THE decision (drives everything, confirm with a CA):**
- **A. Platform = merchant of record (principal) — recommended, Udemy's model.**
  Platform sells the mock package to the student, collects full price + GST, issues
  the tax invoice under the *platform's* GSTIN. The teacher is a content provider
  earning a revenue share; if GST-registered they invoice the platform for their
  share. One GSTIN facing students, platform controls invoicing/branding, no forced
  teacher registration. Best fit for a curated 5–10 teacher start.
- **B. Platform = e-commerce operator (ECO / facilitator).** Teachers are the
  suppliers; platform only facilitates. Triggers GST **TCS 1% (Sec 52, GSTR-8)** +
  **TDS 1% (Sec 194-O)**, and generally requires *every* teacher to be GST-
  registered. Much more compliance. Only if teachers must be the sellers of record.

**GST mechanics (rates/SAC/registration = CA's call, NOT settled here):**
- Online test series ≈ digital service, generally ~18% GST (SAC ~999293 / 998431 —
  CA to confirm). Educational-exemption edge cases exist.
- Place of supply = student's state → CGST+SGST (intra) vs IGST (inter). Capture
  student state at checkout.
- Register for GST when turnover crosses the services threshold (~₹20L) — CA timing.
- Decide tax-inclusive vs tax-added-at-checkout (Udemy adds at checkout for India).

**Billing artifacts:**
- Student: GST-compliant tax invoice (sequential invoice no, date, platform GSTIN,
  SAC, taxable value, CGST/SGST/IGST, total) downloadable from /purchases (extends
  the existing emailed receipt).
- Teacher (Udemy-style): earnings dashboard + monthly **statement** — gross
  attributed sales, platform commission, TDS withheld, net payable, payout status
  (extends /admin/payouts).
- Admin: GST collected/payable summary + transaction history + per-tenant/per-exam
  revenue (notebook page 3).

**Data model additions (once model A is confirmed):**
- `Order`: `taxableValuePaise`, `taxPaise`, `gstRateBps`, `sacCode`,
  `placeOfSupplyState`, `invoiceNo` (unique, sequential), `invoiceDate`.
- A tax config (settings row/env: platform GSTIN, default rate, SAC) **defaulting to
  0% / OFF** until registered + CA sign-off.
- `PayoutStatement` (tenant, period, grossPaise, commissionPaise, tdsPaise, netPaise,
  status) for teacher statements.
- Capture student state at checkout (place of supply).

**Hard flags:**
- **Needs a CA/tax professional before go-live** — rate, SAC, registration timing,
  TCS/TDS applicability, and the principal-vs-ECO classification all carry legal/
  penalty consequences. I can build the *structure* (configurable, tax defaulting
  OFF); the tax *decisions* must be professionally confirmed. Not licensed advice.
- Invoices are legal records: sequential numbering, immutability, retention apply.

## 7. Later layers (post-foundation, not now)

Admin dashboards (student/tenant/revenue splits — page 3), tenant promotional
notifications + WhatsApp Business push, GST/billing/invoicing + transaction
history, grievances, subjects→topics depth, parent accounts, Razorpay Route split
settlement, load/resistance test (10k calls).

## 8. Honest flags

1. Mock quality still reflects on the platform → keep the approve-before-live gate
   + curation.
2. Paying creators = payment intermediary → India TDS(194)/GST/invoicing per
   tenant; check with a CA before first payout.
3. **Production migration risk**: the app is LIVE with a seeded DB. The `UserCredit`
   re-key + new columns must be migrated carefully (build + verify on a dev DB
   first; apply to prod from the user's terminal via `DATABASE_PUBLIC_URL`).

## 9. Reframe of MP TET launch

Keep the lean solo MP TET Maths capture LIVE (SEO shell already deployed) so the
current exam window isn't wasted, while the tenant foundation is built in parallel
as the durable model. (Sequencing still open, but foundation work starts now.)
