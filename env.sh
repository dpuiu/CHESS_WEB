# Container Versions
#export P1=1.2
#export P2=2.7
#export P1=1.5  # caching issues
#export P2=2.10 # caching issues
#export P1=1.6  # caching issues
#export P2=2.11 # caching issues
#export P1=1.6  # caching issues
#export P2=2.11 # caching issues
#export P1=1.7  # removed caching       
#export P2=2.12 # remove caching       
#export P1=1.8  # removed caching dev server
#export P2=2.13 # remove caching dev server
#export P1=1.9  # removed caching dev server
#export P2=2.16 # remove caching dev server
#export P1=1.11
#export P2=2.17 # www.idies.jhu.edu
export P1=1.13  # web.idies.jhu.edu
export P2=2.18  # web.idies.jhu.edu

export M2=2.0

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
#export VITE_API_BASE_URL="http://localhost:5000/api"
#export VITE_API_BASE_URL="https://dev.sites.idies.jhu.edu/api"
#export VITE_API_BASE_URL="https://web.idies.jhu.edu/api"
#VITE_API_BASE_URL="https://web.idies.jhu.edu/chess_web/api"
#export CACHE_TYPE=simple
#export CACHE_DEFAULT_TIMEOUT=300
VITE_BASE_PATH="/chess_app"
VITE_API_BASE_URL="/chess_app/api"
