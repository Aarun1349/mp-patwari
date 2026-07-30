# Lean VPS deploy — ExamsExpress

A single small VPS runs everything (Next.js app + Postgres + Caddy HTTPS) via Docker
Compose. **Fixed, predictable cost — no usage spikes, no auto-suspend.** Scale by
resizing the box (a deliberate choice), then splitting services, as earnings grow.

## Cost model (why this protects your pocket)
| Item | Cost |
|---|---|
| VPS — DigitalOcean **Bangalore** 2GB, or AWS Lightsail **Mumbai** | **~₹1,000/mo FIXED** |
| Cloudflare (DNS/CDN/SSL/DDoS) | ₹0 |
| MSG91 SMS/OTP · Razorpay · email · Sentry | pay-per-use / free tiers (₹0 until you earn) |

A 2GB box comfortably runs ExamsExpress **and** later TOP/TutorOS side by side at
launch scale. Upgrade the droplet size only when metrics say so.

## One-time VPS setup
1. Create the VPS (Ubuntu 24.04, Bangalore/Mumbai region). SSH in.
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. `git clone` this repo to `/opt/examsexpress` and `cd /opt/examsexpress/deploy`
4. `cp app.env.example app.env` and fill in real secrets (see that file).
5. DNS: point `examsexpress.in` A-record at the VPS IP (or via Cloudflare, SSL mode
   = Full (strict)).

## Deploy / update
```bash
cd /opt/examsexpress && git pull
cd deploy && docker compose up -d --build
```
Caddy auto-issues HTTPS certs on first boot. Check: `docker compose logs -f app`.

## Apply the DB schema (first deploy + after schema changes)
The app image is a lean runtime (no Prisma CLI), so run schema pushes with a one-off
full-node container:
```bash
docker compose run --rm --build --entrypoint \
  "sh -c 'npx prisma db push && npx prisma db seed'" app
```
Then create your admin + seed the free Maths mock:
```bash
docker compose run --rm --entrypoint \
  "sh -c 'ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=... npx tsx scripts/create-admin.ts && npx tsx scripts/seed-mptet-maths-mock.ts'" app
```
> (First launch on a fresh DB = a clean `db push`; no reset/migration dance needed.)

## Backups
```bash
chmod +x backup.sh
crontab -e   # add:  0 2 * * *  /opt/examsexpress/deploy/backup.sh
```
Also sync `deploy/backups/` off-server (rclone → Cloudflare R2 / Drive).

## Scaling path (each step optional, revenue-funded)
1. Resize the droplet (2GB → 4GB → 8GB) — 30 seconds, deliberate.
2. Uncomment **redis** (caching + rate limits) and **pgbouncer** (connection pooler)
   in `docker-compose.yml`; repoint `DATABASE_URL` → pgbouncer.
3. Move Postgres to its own box / managed Postgres (Neon/Supabase) + read replica.
4. Add a second app host if you outgrow one VPS.

## Adding TOP / TutorOS to the same box
Add a `tutoros` service (its own image + Postgres, share `redis`) to
`docker-compose.yml`, and a site block in `Caddyfile` for its domain. One VPS, two
products, one bill.
