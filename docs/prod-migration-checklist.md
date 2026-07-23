# Production migration — tenant + RBAC + billing

Promotes the `multiexam-platform` branch schema (Tenant, Role/RBAC, Enrollment,
`tenantId` on Paper/Package/Order/UserCredit, `UserCredit` re-key, PayoutStatement,
SequenceCounter, Order billing fields) to the **live** prod DB.

Run all DB commands from **your own terminal** in the project dir using
`DATABASE_PUBLIC_URL` (the sandbox can't reach prod). In cmd:
`set "DATABASE_URL=<DATABASE_PUBLIC_URL>"`. No new env vars are required — GST stays
OFF (its env vars are simply unset).

## 0. Back up first (non-negotiable)
- Take a Railway Postgres snapshot, **or** `pg_dump "$DATABASE_PUBLIC_URL" > backup.sql`.

## 1. Decide the path — does prod have REAL data?
From your terminal (DATABASE_URL = prod public URL):
```
npx tsx --env-file=.env -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); Promise.all([p.user.count(),p.order.count(),p.attempt.count(),p.adminUser.count()]).then(([users,orders,attempts,admins])=>{console.log({users,orders,attempts,admins});process.exit(0)})"
```
- **All ~0 (only seed data)** → **Path A** (simple reset). This is likely if you haven't onboarded real students yet.
- **Real students/orders/attempts exist** → **Path B** (preserve data).

---

## Path A — prod is empty / seed-only (simplest)
Same as the dev rebuild. Destroys prod data (you confirmed it's only seed).
1. `npx prisma db push --force-reset --accept-data-loss` *(you run it — the AI-safety guard blocks me from destructive DB ops; that's correct)*
2. `npm run db:seed` (creates platform tenant, 4 roles, exam, packages)
3. Recreate your admin login: `ADMIN_EMAIL=… ADMIN_PASSWORD=… npx tsx scripts/create-admin.ts` (now assigns the `admin` role automatically)
4. Deploy code → **§3**.

---

## Path B — prod has real data (preserve it) — two-phase
The blockers to a one-shot push: `AdminUser.roleId` is NOT NULL with no default, and
the `tenantId` FKs need the `platform` tenant to exist. So: push nullable → backfill →
push final.

**Phase 1 — additive, nullable (I'll hand you a temporary schema variant):**
- Temporarily: `roleId String?`, and the four `tenantId` columns `String?` (nullable,
  no default). `UserCredit` unique stays `(userId, examId)` for now.
- `npx prisma db push` → creates tenants/roles/enrollments/payout_statements/
  sequence_counters + nullable columns. No NOT-NULL/FK violation on existing rows.

**Phase 2 — seed + backfill (raw SQL / script):**
```sql
-- platform tenant (fixed id)
INSERT INTO tenants (id, slug, name, "ownerName", approved, "revenueShareBps", "isActive", "createdAt")
VALUES ('platform','platform','ExamsExpress','ExamsExpress',true,0,true,now())
ON CONFLICT (id) DO NOTHING;
-- roles: run `npm run db:seed` (idempotent — it upserts the 4 system roles), OR insert them.
-- backfill owners
UPDATE papers        SET "tenantId"='platform' WHERE "tenantId" IS NULL;
UPDATE packages      SET "tenantId"='platform' WHERE "tenantId" IS NULL;
UPDATE orders        SET "tenantId"='platform' WHERE "tenantId" IS NULL;
UPDATE user_credits  SET "tenantId"='platform' WHERE "tenantId" IS NULL;
-- existing admin(s) -> admin role
UPDATE admin_users SET "roleId"=(SELECT id FROM roles WHERE key='admin') WHERE "roleId" IS NULL;
```

**Phase 3 — push the FINAL schema (from the branch):**
- Restore the real schema (`tenantId String @default("platform")` NOT NULL + relations,
  `roleId String` NOT NULL, `UserCredit @@unique([userId, examId, tenantId])`).
- `npx prisma db push --accept-data-loss` (the "data loss" warning is only the invoiceNo
  unique index + the unique-key swap; all rows now have values, so it succeeds).

> Ping me when you're at Path B and I'll generate the exact temporary schema file + a
> single backfill script so you just run three commands.

---

## 3. Deploy the code (both paths)
Prod code must match the new schema — deploy right after the DB is migrated.
```
railway up --detach --service mp-patwari
```
Then verify `railway deployment list` reaches SUCCESS.

## 4. Post-deploy smoke test
- `https://examsexpress.in/` loads (200).
- Admin login works; a partner login lands on the scoped PartnerHome (not platform pages).
- `/t/<a-tenant-slug>` renders; `/teachers` (as a student) lists tenants.
- A test purchase (Razorpay **test** mode) → tenant credit + auto-enroll + `/invoice/<id>`.

## 5. NOT part of this migration — still required to actually launch
- **Auth is broken in prod** (see below): Google redirect URI + Twilio trial account.
- **Razorpay LIVE keys** confirmed.
- **Real content**: MP TET Maths exam + mocks + questions, or onboarded teachers.
