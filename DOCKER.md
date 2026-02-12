# CHESS_WEB Multi-container Setup

**Author:** Daniela Puiu\
**Last Update:** 2026-02-12\
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for [CHESS_WEB](https://github.com/alevar/CHESS_WEB)

# 1. Files

## 1.1 Docker Compose YAML Files

-   `docker-compose.yml` : Main file; production code\
-   `docker-compose.dev.*.yml` : Additional development/production setups

## 1.2 Dockerfiles

-   `CHESSApp_back/Dockerfile` : Backend\
-   `CHESSApp_front_admin/Dockerfile` : Admin frontend\
-   `Dockerfile.public` : Public frontend + backend\
-   `CHESSApp_front_public/Dockerfile` : Public frontend (outdated)

## 1.3 Other Files (included)

-   `.env` : Contains MySQL users, passwords, and service ports\
-   `my_custom.cnf` : MySQL (mysqld) configuration\
-   `db_init.sh` : Creates the MySQL database & users and sets
    permissions\
-   `CHESSApp_DB/chess.db.schema.mysql.sql`: Creates the MySQL database
    tables

## 1.4 Other Files (separate download)

-   Docker images:
    [https://hub.docker.com](https://hub.docker.com/repositories/dpuiu2)
-   CHESS database copy:
    [ftp://ftp.ccb.jhu.edu](ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB) ;
    tar.gz files, \~7G
-   Protein files available on
    [isoform.io](https://storage.googleapis.com/isoform.io/pdb_v1.3/)

# 2. Docker Compose Services

-   `mysql`\
-   `backend_admin`\
-   `frontend_admin`\
-   `public`

# 3. Docker Compose Volumes

-   `mysql_data`\
-   `./CHESS_WEB` : bind-mount database backup and genome files

# 3. CHESS Database

## 3.1 Download Copies

``` bash
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.tgz
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_dev_backups.tgz  # test
```

## 3.2 Check File Sizes

``` bash
du -hs *
  6.9G  CHESSApp_prod_backups.tgz
  96M   CHESSApp_dev_backups.tgz  # test
```

## 3.3 Extract Archives

``` bash
tar -xzvf CHESSApp_prod_backups.tgz
tar -xzvf CHESSApp_dev_backups.tgz  # test

tree -L 2 ./CHESS_WEB/
./CHESS_WEB/
├── CHESSApp_data
├── CHESSApp_dev_backups            # test
│   └── backup_2025-12-21_22-53-30  # test
└── CHESSApp_prod_backups
    └── backup_2026-01-22_13-42-15
```

The ./CHESS_WEB directory which will map to /CHESS_WEB volume !!!

# 4. Docker Commands

> Note: default vs custom options

## 4.1 Build Containers

``` bash
docker compose build  
docker compose build -f docker-compose.yml --no-cache --parallel
```

## 4.2 Start Containers

``` bash
docker compose up  
docker compose up -p chess_web -f docker-compose.yml --env-file .env -d
docker compose up mysql backend_admin frontend_admin
docker compose up mysql public
```

## 4.3 Check Images

``` bash
docker images
```

## 4.3 Check Running Containers

``` bash
docker ps --no-trunc | cut -c68-
```

## 4.3 Stop Containers

``` bash
docker compose down  
docker compose down -v  
```

## 4.4 Check Running Containers and Volumes

``` bash
docker ps  
docker volume ls  
```

# 5. Admin Website

``` bash
http://localhost:5112/
```

## 5.1 Restore Database Paths

``` bash
/CHESS_WEB/CHESSApp_prod_backups/backup_2026-01-22_13-42-15/ 
/CHESS_WEB/CHESSApp_dev_backups/backup_2025-12-21_22-53-30/  # test
  
/CHESS_WEB/CHESSApp_data
```

## 5.2 Data Directory

**DO NOT SET**

# 5. Public Website

``` bash
http://localhost:5000/chess_app/
```
