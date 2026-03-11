#!/bin/bash
set -euo pipefail

# populate db
curl -L --fail --retry 5 "$CHESSDB_BACKUP_URL"  | mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$CHESSDB_NAME"
