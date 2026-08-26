#!/usr/bin/env bash
# Restore DRILL — proves a backup actually restores. An untested backup is not a
# backup. Restores the newest (or a given) dump into a throwaway scratch database,
# sanity-checks it, then drops it. NON-destructive to production. Run monthly.
#
#   ./restore.sh                       # newest local dump
#   ./restore.sh backups/examsexpress-20260820-020000.sql.gz
#
# For a REAL disaster restore (into the live DB), see BACKUPS.md — that is a
# deliberate, app-down operation, not this drill.
set -euo pipefail

cd "$(dirname "$0")"
set -a; source ./app.env 2>/dev/null || true; source ./db.env 2>/dev/null || true; set +a

DUMP="${1:-$(ls -1t ./backups/examsexpress-*.sql.gz 2>/dev/null | head -1)}"
if [ -z "${DUMP:-}" ] || [ ! -f "$DUMP" ]; then
  echo "No dump found. Pass one explicitly, or run backup.sh first." >&2
  exit 1
fi
SCRATCH="${POSTGRES_DB}_restoretest"

echo "Restore drill: $DUMP → scratch db '$SCRATCH' (production untouched)"
gzip -t "$DUMP" || { echo "Dump failed gzip integrity check — aborting." >&2; exit 1; }

docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS $SCRATCH;" -c "CREATE DATABASE $SCRATCH;"

gunzip -c "$DUMP" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$SCRATCH" -q >/dev/null

echo "--- restored schema sanity ---"
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$SCRATCH" -t \
  -c "SELECT 'tables in public: ' || count(*) FROM information_schema.tables WHERE table_schema='public';"

# Drop the scratch db no matter what happened above.
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DROP DATABASE IF EXISTS $SCRATCH;" >/dev/null

echo "Restore drill PASSED — the dump restores cleanly. Scratch db dropped."
