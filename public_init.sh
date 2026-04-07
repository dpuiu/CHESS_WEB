#!/bin/bash
#set -e
#if [ -n "$CHESSAPP_DATA_URL" ]; then
#curl -L --fail --retry 5 "$CHESSAPP_DATA_URL" -o /tmp/tmp.tgz
#tar -xzvf /tmp/tmp.tgz -C /tmp
#rm -f /tmp/tmp.tgz
#fi
curl -L --fail --retry 5 "$CHESSAPP_DATA_URL" | tar -xz -C /tmp
exec /opt/venv/bin/gunicorn -w "${GUNICORN_WORKERS:-2}" -b 0.0.0.0:5000 --timeout 600 --log-level debug --access-logfile - --error-logfile - app_public:app
