# Scaling foundation

Grounded read of what the ExamsExpress infra needs to hold real load, ranked by
when it actually matters. **Principle: add each layer when metrics approach the
limit, not speculatively.** The architecture is additive — none of this is a rewrite.

## The one thing to do before launch: connection pooling

**Why:** the app is a plain `new PrismaClient()`. Prisma's default pool is
~`cpus×2+1` (≈5) connections **per app instance**. Thousands of concurrent users
funnelled through ~5 Postgres connections = request queueing and timeouts. This
breaks at *hundreds* concurrent — a scale you could hit on day one if a teacher
with a big audience shares their link.

**Code side — DONE:** `schema.prisma` now declares both:
- `url = env("DATABASE_URL")` → the **pooled** connection (used at runtime).
- `directUrl = env("DIRECT_DATABASE_URL")` → the **direct** connection (used by
  `prisma db push` / migrations — a transaction-mode pooler can't run those).

In dev both point at localhost (no pooler). `DIRECT_DATABASE_URL` was added to `.env`.

**Infra side — you do this on Railway (part of the deploy):**
1. Put a pooler in front of Postgres — **PgBouncer** in *transaction* mode
   (Railway PgBouncer template/plugin, or Railway's managed pooler if enabled).
2. Set the service env vars:
   - `DATABASE_URL` → the **pooler** endpoint, with Prisma's pooler flags:
     `...@<pooler-host>:6432/railway?pgbouncer=true&connection_limit=10`
     (`pgbouncer=true` disables prepared statements, required for tx-mode; tune
     `connection_limit` per instance — start ~10.)
   - `DIRECT_DATABASE_URL` → the **direct** Postgres endpoint (port 5432), no flags.
3. Redeploy. Migrations use the direct URL; the running app uses the pool.

> Without this, horizontal scaling makes things *worse* (each new instance opens
> its own 5 direct connections and exhausts Postgres faster). Pooling first.

## Ranked roadmap

| When | Do | Why |
|---|---|---|
| **Before launch** | **Connection pooling** (above) | Breaks at hundreds concurrent otherwise |
| Before launch | Confirm hot-path indexes exist (attempts by user/paper, sessions by tokenHash, orders by tenant — already present) | Cheap, avoids slow scans |
| At first real traffic | **Horizontal app replicas** on Railway (2–3 instances behind the LB) + pooling already in place | Handle concurrent request volume |
| At first real traffic | **Redis cache** for papers/questions (mostly static) + move rate limits off the `RateLimitCounter` table | Offloads the heaviest read path from Postgres |
| Approaching high load | **Postgres read replica** (or bigger instance) for read-heavy exam loads | Split reads from writes |
| High load / bulk sends | **Queue** (BullMQ/Redis) for notifications + heavy jobs | Don't do bulk work in request path |
| Later | CDN for static assets; batch exam heartbeat/answer writes | Marginal at first, real at scale |

## What's already right (don't touch)
- Session sliding-expiry writes are **throttled to once/minute** (not per-request) —
  the obvious write-amplification foot-gun is already handled.
- Single `PrismaClient` singleton (no client-per-request leak).
- Exam credit decrement + order crediting are atomic/race-safe.

## The honest note
You have ~0 users. Building for 100k/10k-concurrent *now* is premature. Do
**connection pooling** (cheap, prevents day-one breakage), then let real metrics
pull the rest in — replicas, cache, read replica — each when you're actually
approaching its limit.
