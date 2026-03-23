# CHESS_WEB Multi-container Setup

**Author:** Daniela Puiu
**Last Update:** 2026-03-23
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for [CHESS_WEB](https://github.com/alevar/CHESS_WEB)

# 1. Files

## 1.1 Docker Compose YAML Files

* `docker-compose.yml` : Main file; production code

## 1.2 Dockerfiles

* `CHESSApp_back/Dockerfile` : Backend
* `CHESSApp_front_admin/Dockerfile` : Admin frontend
* `CHESSApp_front_public/Dockerfile` : Public frontend (outdated)
* `Dockerfile.public` : Public frontend + backend

## 1.3 Other Files (included)

* `.env` : Contains MySQL users, passwords, and service ports
* `my_custom.cnf` : MySQL (mysqld) configuration
* `db_init.{sh,sql}` : Creates the MySQL database & users and sets permissions
* `CHESSApp_DB/chess.db.schema.mysql.sql`: Creates the MySQL database tables

## 1.4 Other Files (separate download)

* Docker images:  [https://hub.docker.com](https://hub.docker.com/repositories/dpuiu2)
* CHESS database copy:  [ftp://ftp.ccb.jhu.edu](ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB) ; tar.gz files, ~7GB
* Protein files available on  [isoform.io](https://storage.googleapis.com/isoform.io/pdb_v1.3/)

# 2. Docker Compose Services

* `mysql`
* `backend_admin`
* `frontend_admin`
* `public`

# 3. Docker Compose Volumes

* `mysql_data`
* `./CHESS_WEB` : bind-mount database backup and genome files

# 4. CHESS Database

## 4.1 Download Copies

```bash
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.data.tgz
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.db.gz

tar -xzvf CHESSApp_prod_backups.tgz -O CHESS_WEB/
zcat CHESSApp_prod_backups.db.gz > CHESS_WEB/CHESSApp_prod_backups/db.backup.sql   
```

The `./CHESS_WEB` directory will map to the `/CHESS_WEB` volume.

# 5. Docker Commands

> Note: default vs custom options

## 5.1 Build Containers

```bash
docker compose build  
docker compose build -f docker-compose.yml --no-cache --parallel
```

## 5.2 Start Containers

```bash
docker compose up mysql backend_admin frontend_admin
docker compose up mysql public
```

## 5.3 Stop Containers

```bash
docker compose down     # or
docker compose down -v  # delete volumes 
```

# 6. Admin Website

```bash
http://localhost:5112/
```

## 6.1 Restore Database Paths

```bash
/CHESS_WEB/CHESSApp_backups/
/CHESS_WEB/CHESSApp_data/
```

## 6.2 Data Directory

**DO NOT SET**

# 7. Public Website

```bash
http://localhost:5000/chess_app/
```
