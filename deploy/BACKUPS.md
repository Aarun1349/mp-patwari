# Backups & disaster recovery

Three layers, cheapest → strongest. The database is the only irreplaceable thing on
the box — the app image rebuilds from git, but customer accounts, orders, credits and
attempts live only in Postgres.

## Layer 1 — daily dump, local + off-site (`backup.sh`)

`backup.sh` `pg_dump`s the `db` container nightly, keeps 14 days locally, and (when
configured) copies each dump **off-site** with rclone. A backup on the same box does
not survive losing the box, so the off-site copy is the one that actually matters.

**One-time server setup:**

1. Install rclone: `sudo apt install rclone` (or `curl https://rclone.org/install.sh | sudo bash`).
2. Create a bucket at a provider with a free/cheap tier and no egress fees on restore:
   - **Cloudflare R2** (recommended — zero egress) or **Backblaze B2** (cheapest storage).
3. Configure the remote: `rclone config` → new remote named e.g. `r2`, type S3/R2,
   paste the bucket's access key + secret. Test: `rclone lsd r2:`.
4. Add to `deploy/db.env`:
   ```
   BACKUP_RCLONE_REMOTE=r2:examsexpress-backups
   BACKUP_OFFSITE_KEEP=30
   ```
5. Install the cron (as the deploy user):
   ```
   crontab -e
   # add:
   0 2 * * *  /opt/examsexpress/deploy/backup.sh >> /opt/examsexpress/deploy/backups/backup.log 2>&1
   ```
6. Run it once by hand and confirm both local + off-site: `./backup.sh` then `rclone ls r2:examsexpress-backups`.

## Layer 2 — Lightsail automatic snapshots (whole-disk)

In the Lightsail console → your instance → **Snapshots** → enable **Automatic
snapshots**. This captures the entire disk (DB volume included) and is the fastest way
to roll the whole box back. Keep ~7 days. (Console toggle — nothing to deploy.)

## Layer 3 — monthly restore DRILL (`restore.sh`)

An untested backup is not a backup. Once a month:
```
cd /opt/examsexpress/deploy && ./restore.sh
```
It restores the newest dump into a throwaway scratch DB, prints the table count, and
drops it — production is never touched. If it prints **PASSED**, backups are real.

## Real disaster restore (app-down, deliberate)

Only when actually recovering. This overwrites live data — be sure.
```
cd /opt/examsexpress/deploy
docker compose stop app                     # stop writes
# get a dump: newest local (./backups/…) or pull from off-site:
#   rclone copy r2:examsexpress-backups/examsexpress-YYYYMMDD-HHMMSS.sql.gz ./backups/
gunzip -c ./backups/examsexpress-<STAMP>.sql.gz \
  | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
docker compose start app
```
For a from-scratch box: bring the stack up, run the `migrate` service once to create
the schema, then restore the dump as above.

## What good looks like
- [ ] `backup.sh` cron installed, `backups/backup.log` shows a nightly line
- [ ] Off-site copy present (`rclone ls`), not just local
- [ ] Lightsail automatic snapshots ON
- [ ] `restore.sh` PASSED at least once (and monthly thereafter)
