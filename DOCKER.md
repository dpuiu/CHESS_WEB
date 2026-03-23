# CHESS_WEB Setup

**Author:** Daniela Puiu  
**Last Update:** 2026-03-23  
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for [CHESS_WEB](https://github.com/alevar/CHESS_WEB)  

# GOAL

* Run locally on Linux desktop
* Update database and docker images

# SETUP

## Download Git Repository

```bash
git pull https://github.com/dpuiu/CHESS_WEB.git
cd CHESS_WEB/
```

## Download CHESS Database

* From JHU CCB ftp site:

```bash
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.data.tgz
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.db.gz

tar -xzvf CHESSApp_prod_backups.data.tgz -C CHESS_WEB/
zcat CHESSApp_prod_backups.db.gz > CHESS_WEB/CHESSApp_prod_backups/db.backup.sql
```

## Start Containers

```bash
# Start all
docker compose up                             # or
docker compose -f docker_compose.yml up       # same

# Start only admin services
docker compose up mysql backend_admin frontend_admin

# Start only public services
docker compose up mysql public
```
Note: containers are automatically pulled from Dockerhub.com on the 1st run and cached  
Version: 1.0  

## Connect to the Admin Website

Web interface on local machine:

```
http://localhost:5112/
```

Provide Database Paths (inside container):

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

# Stop and remove volumes (delete volume database)
docker compose down -v
```

# Git Files

* Docker Compose YAML Files

```bash
docker-compose.yml                 # Default Docker Compose file
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
.env                              # MySQL users, passwords, ports
my_custom.cnf                     # MySQL (mysqld) configuration
db_init.sh / db_init.sql          # Creates MySQL database, users, and permissions
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
* CHESS database copy: [FTP Server](ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB) (~7 GB)
* Protein files: [isoform.io](https://storage.googleapis.com/isoform.io/pdb_v1.3/)
