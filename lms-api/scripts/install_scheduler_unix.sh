#!/usr/bin/env sh
set -eu

INTERVAL_MINUTES="${1:-15}"
PHP_BIN="${PHP_BIN:-php}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
WORKER_PATH="$SCRIPT_DIR/report_schedule_worker.php"

if [ ! -f "$WORKER_PATH" ]; then
  echo "Worker script not found: $WORKER_PATH" >&2
  exit 1
fi

if ! command -v "$PHP_BIN" >/dev/null 2>&1; then
  echo "PHP executable not found: $PHP_BIN" >&2
  exit 1
fi

if [ "$INTERVAL_MINUTES" -le 0 ]; then
  echo "Interval must be greater than 0" >&2
  exit 1
fi

CRON_EXPR="*/$INTERVAL_MINUTES * * * * \"$PHP_BIN\" \"$WORKER_PATH\" >/dev/null 2>&1"

( crontab -l 2>/dev/null | grep -v "report_schedule_worker.php"; echo "$CRON_EXPR" ) | crontab -

echo "Crontab updated: every $INTERVAL_MINUTES minutes"
