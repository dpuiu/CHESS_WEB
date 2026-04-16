# Container Versions
export V1=1.2
export V2=2.7

# MySQL
export MYSQL_ROOT_PASSWORD=your_secure_password
export MYSQL_PORT=3306
export CHESSDB_NAME=CHESS_DB
export CHESSDB_BACKUP_URL="ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.db.sql"
export CHESSAPP_DATA_URL="ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.data.tgz"
export CHESSAPP_DB_URL="ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.db.gz"

# Admin
export FLASK_ADMIN_PORT=5001
export FRONTEND_ADMIN_PORT=5112
export CHESSDB_ADMIN_PASS=your_admin_password
export CHESSDB_ADMIN_USER=chess_admin

# Public; FLASK_PUBLIC_PORT only port that can;t change???
export FLASK_PUBLIC_PORT=5000
export FRONTEND_PUBLIC_PORT=5113
export CHESSDB_PUBLIC_PASS=your_public_password
export CHESSDB_PUBLIC_USER=chess_public

# Other
export FLASK_DEBUG=0
export GUNICORN_WORKERS=2
export VITE_API_BASE_URL="https://dev.sites.idies.jhu.edu/api"
#export VITE_BASE_PATH="https://dev.sites.idies.jhu.edu"
