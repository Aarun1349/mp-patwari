#!/usr/bin/env bash
# Daily Postgres backup. Add to cron:  0 2 * * *  /opt/examsexpress/deploy/backup.sh
# Keeps the last 14 daily dumps locally. For real safety, also sync the backups dir
# off-server (e.g. `rclone copy` to Cloudflare R2 / Google Drive) — a backup on the
# same box you're backing up is only half a backup.
set -euo pipefail

cd "$(dirname "$0")"
set -a; source ./app.env 2>/dev/null || true; source ./db.env 2>/dev/null || true; set +a

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/examsexpress-$STAMP.sql.gz"

docker compose exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$FILE"
echo "Backup written: $FILE ($(du -h "$FILE" | cut -f1))"

# Retention: keep the 14 most recent.
ls -1t "$BACKUP_DIR"/examsexpress-*.sql.gz | tail -n +15 | xargs -r rm -f
