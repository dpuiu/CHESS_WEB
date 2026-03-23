# CHESS_WEB Multi-Container Setup

**Author:** Daniela Puiu
**Last Update:** 2026-03-23
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for [CHESS_WEB](https://github.com/alevar/CHESS_WEB)

```bash
git pull https://github.com/dpuiu/CHESS_WEB.git
```

# SETUP

## Download Git Repository

```bash
git pull https://github.com/dpuiu/CHESS_WEB.git
cd CHESS_WEB/
```

## Download Database

```bash
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.data.tgz
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.db.gz

tar -xzvf CHESSApp_prod_backups.data.tgz -C CHESS_WEB/
zcat CHESSApp_prod_backups.db.gz > CHESS_WEB/CHESSApp_prod_backups/db.backup.sql
```

## Build Containers (optional)

```bash
docker compose build
```

## Start Containers

```bash
# Start all services
docker compose up

# Start only admin services
docker compose up mysql backend_admin frontend_admin

# Start only public services
docker compose up mysql public
```

## Connect to the Admin Website

Web interface on local machine:

```
http://localhost:5112/
```

Database Paths (inside container):

```
/CHESS_WEB/CHESSApp_backups/
/CHESS_WEB/CHESSApp_data/
```

## Connect to the Public Website

Web interface on local machine:

```
http://localhost:5000/chess_app/
```

## Stop Containers

```bash
# Stop all services
docker compose down

# Stop and remove volumes (deletes database)
docker compose down -v
```

# Git Files

* Docker Compose YAML Files

```bash
docker-compose.yml  # Main Compose file
```

* Dockerfiles

```bash
CHESSApp_back/Dockerfile           # Backend
CHESSApp_front_admin/Dockerfile    # Admin frontend
CHESSApp_front_public/Dockerfile   # Public frontend (outdated)
Dockerfile.public                  # Public frontend + backend
```

* Other Files

```bash
.env                          # MySQL users, passwords, and service ports
my_custom.cnf                 # MySQL (mysqld) configuration
db_init.sh / db_init.sql      # Creates MySQL database, users, and permissions
CHESSApp_DB/chess.db.schema.mysql.sql  # Creates MySQL database tables
```

# Docker Compose Services

* `mysql`
* `backend_admin`
* `frontend_admin`
* `public`

# Docker Compose Volumes

* `mysql_data`
* `./CHESS_WEB` — bind-mounted for database backups and genome files

# Online Data

* Docker images: [Docker Hub Repository](https://hub.docker.com/repositories/dpuiu2)
* CHESS database copy: [FTP Server](ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB) (~7 GB, tar.gz files)
* Protein files: [isoform.io](https://storage.googleapis.com/isoform.io/pdb_v1.3/)
