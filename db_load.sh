#!/bin/bash
set -euo pipefail

# populate db
curl -L --fail --retry 5 "$CHESSDB_BACKUP_URL"  > /docker-entrypoint-initdb.d/db_init_3.sql
