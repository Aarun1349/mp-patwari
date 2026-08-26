#!/usr/bin/env bash
# Daily Postgres backup — local + off-site.
#
# Cron (run as the deploy user):
#   0 2 * * *  /opt/examsexpress/deploy/backup.sh >> /opt/examsexpress/deploy/backups/backup.log 2>&1
#
# A backup on the same box you're backing up is only half a backup, so this also
# pushes each dump OFF-SITE with rclone when a remote is configured. Set these in
# deploy/db.env (or app.env):
#   BACKUP_RCLONE_REMOTE=r2:examsexpress-backups      # any rclone remote (R2/B2/S3/Drive)
#   BACKUP_OFFSITE_KEEP=30                             # how many dumps to keep off-site
# One-time rclone setup on the server: `rclone config` (see BACKUPS.md).
set -euo pipefail

cd "$(dirname "$0")"
set -a; source ./app.env 2>/dev/null || true; source ./db.env 2>/dev/null || true; set +a

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/examsexpress-$STAMP.sql.gz"

echo "[$(date -Is)] starting backup → $FILE"
docker compose exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$FILE"

# Integrity guard: a truncated/failed dump must never silently replace good ones
# or get counted toward retention. gzip -t verifies the archive; then check size.
if ! gzip -t "$FILE" 2>/dev/null; then
  echo "[$(date -Is)] ERROR: dump failed gzip integrity check — removing $FILE" >&2
  rm -f "$FILE"
  exit 1
fi
SIZE_BYTES=$(stat -c%s "$FILE" 2>/dev/null || stat -f%z "$FILE")
if [ "${SIZE_BYTES:-0}" -lt 1024 ]; then
  echo "[$(date -Is)] ERROR: dump suspiciously small (${SIZE_BYTES}B) — removing $FILE" >&2
  rm -f "$FILE"
  exit 1
fi
echo "[$(date -Is)] local backup ok ($(du -h "$FILE" | cut -f1))"

# Local retention: keep the 14 most recent.
ls -1t "$BACKUP_DIR"/examsexpress-*.sql.gz | tail -n +15 | xargs -r rm -f

# Off-site copy (only if configured + rclone installed).
if [ -n "${BACKUP_RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null 2>&1; then
  echo "[$(date -Is)] uploading off-site → ${BACKUP_RCLONE_REMOTE}"
  rclone copy "$FILE" "${BACKUP_RCLONE_REMOTE}/" --no-traverse
  # Off-site retention: prune dumps older than BACKUP_OFFSITE_KEEP (default 30).
  KEEP="${BACKUP_OFFSITE_KEEP:-30}"
  rclone lsf "${BACKUP_RCLONE_REMOTE}/" --include "examsexpress-*.sql.gz" \
    | sort -r | tail -n +"$((KEEP + 1))" \
    | while read -r old; do rclone deletefile "${BACKUP_RCLONE_REMOTE}/${old}"; done
  echo "[$(date -Is)] off-site upload done (keeping ${KEEP})"
else
  echo "[$(date -Is)] WARNING: no off-site backup — set BACKUP_RCLONE_REMOTE + install rclone (see BACKUPS.md). A same-box backup does not survive losing the box." >&2
fi
