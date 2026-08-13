---
status: accepted
date: 2026-07-21
tags: [decision, deployment, cost]
---

# 0005 — Lean single-VPS deployment (off Railway)

## Context
On Railway, the free-trial credit ran out, the service was suspended, and the site
404'd. For a pre-revenue solo founder, an unpredictable usage-billed platform is a
real risk. The requirement: **fixed, predictable cost (~₹1,000/mo), no surprise
usage bills**, with headroom for a second product later.

## Decision
Self-manage one small VPS — **AWS Lightsail Mumbai** (static IP `13.202.164.83`) —
running **Docker Compose**: Next.js standalone app + **internal** Postgres (never
internet-exposed) + **Caddy** (auto-HTTPS via Let's Encrypt). Schema/seed via a
one-off `migrate` service (full build image with Prisma CLI + tsx). A 4 GB swapfile
covers build memory. Secrets in `deploy/.env`. DNS stays on Netlify (apex + www A →
the IP).

## Alternatives considered
- **Stay on Railway (paid)** — convenient, but usage-billed = the exact risk we were
  burned by.
- **Managed PaaS (Render/Fly/Vercel + managed PG)** — simpler ops, but higher and
  less predictable cost, and Postgres egress/pooling constraints.
- **Kubernetes / multi-box** — absurd overhead at this scale.

## Consequences
- **Good:** flat monthly cost; full control; one box can host a second product
  (TutorOS) later; upgrade = resize the box.
- **Cost:** we own patching/backups/uptime; the dev sandbox **cannot** reach the prod
  DB (egress 80/443 only) — DB/migration commands run from the user's own terminal.
- **Follow-ups:** backups cron + off-site sync; enable PgBouncer when concurrency
  grows (schema already carries `directUrl`).

## Related
`../deploy/README.md` · `../deploy/docker-compose.yml` · `../docs/scaling-foundation.md`
· [[Current-State]]
