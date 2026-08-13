@AGENTS.md

# ExamsExpress

Online mock-test platform for Indian competitive exams (MP Patwari, MP TET),
evolving into a teacher marketplace. Next.js 16 · Prisma 6 · PostgreSQL.

## 📚 Read the vault first

**`vault/`** is the source of truth for product, rules, architecture, and decisions.
Start every task by reading, in order:

1. `vault/CLAUDE.md` — how the vault works + ground rules
2. `vault/Product.md` — what we're building and for whom
3. `vault/Current-State.md` — what actually exists and runs today
4. `vault/Architecture.md` — stack, layers, data model, request flow
5. `vault/Business-Rules.md` — **read before changing any money / exam / auth / tenant logic** (🔒 rules are concurrency-critical)
6. The relevant note in `vault/Features/`, `Bugs/`, or `Tasks/`

Record work as you go: bugs → `Bugs/`, capabilities → `Features/`, units of work →
`Tasks/`, lasting choices → `Decisions/` (ADRs — supersede, never silently reverse).
Update `Current-State.md` when what-exists changes.

## Golden rules (don't violate without an ADR)

1. **Never hard-delete** a student/attempt/order/exam — deactivate/archive only.
2. **Every query is scoped by owner** (`tenantId` / `userId`) — no cross-tenant access.
3. **One domain must never corrupt another.**
4. **Money is idempotent** — webhooks/payments must never double-charge or double-credit.
5. **Smallest safe fix** — don't refactor unrelated modules while fixing a bug.
6. **No invented external APIs**; onboard new exams by **config, not code**.
7. **Verify before "done":** `npm run build`.

## Quick commands
- `npm run dev` — dev server
- `npm run build` — typecheck/compile
- `npm run db:push` / `npm run db:seed` — Prisma schema push / seed
