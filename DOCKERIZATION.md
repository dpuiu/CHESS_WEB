# CHESS_WEB Multi-container Setup

**Author:** Daniela Puiu  
**Date:** 2026-02-10  
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for \
  [CHESS_WEB](https://github.com/alevar/CHESS_WEB)

# 1. Files

## 1.1 Docker Compose YAML Files

- `docker-compose.yml` : Main file; production code with comments  
- `docker-compose.dev.yml` : Development; builds all images except MySQL  
- `docker-compose.prod.yml` : Production; pulls all images from Docker Hub  

## 1.2 Dockerfiles  

- `CHESSApp_back/Dockerfile` : Backend (admin/public)  
- `CHESSApp_front_admin/Dockerfile` : Frontend admin  
- `CHESSApp_front_public/Dockerfile` : Frontend public  

## 1.3 Other Files (included)

- `.env` : Contains MySQL users, passwords, and service ports  
- `db_init.sh` : Creates the MySQL database & users and sets permissions  
- `my_custom.cnf` : MySQL (mysqld) configuration  

## 1.4 Other Files (separate download)

- Docker images  
  [https://hub.docker.com](https://hub.docker.com/repositories/dpuiu2)

- CHESS database copy 
  [ftp.ccb.jhu.edu](ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB)
  tar.gz files, 7G

# 2. Docker Compose Services and Volumes

## 2.1 Services

### 2.1.1 Production (4)

- `mysql`  
- `backend_admin`  
- `frontend_admin`  
- `backend_public`  

### 2.1.2 Development (5)

- `mysql`  
- `backend_admin`  
- `frontend_admin`  
- `backend_public`  
- `frontend_public`  

## 2.2 Volumes

### 2.2.1 Production (2)

- `mysql_data`  
- `frontend_dist` : npm build `dist` directory
- `./CHESS_WEB`   : bind-mount database backup and genome files

### 2.2.2 Development (1)

- `mysql_data`  

# 3. CHESS Database

## 3.1 Download (Test / All)

```bash
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_dev_backups.tgz
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.tgz
```

## 3.2 Check Size

```bash
du -hs *
  96M   CHESSApp_dev_backups.tgz
  6.9G  CHESSApp_prod_backups.tgz
```

## 3.3 Extract Archives => CHESS_WEB Directory

```bash
tar -xzvf CHESSApp_dev_backups.tgz
tar -xzvf CHESSApp_prod_backups.tgz
```

# 4. Docker Commands

> Note: default vs custom options

## 4.1 Build Containers

```bash
docker compose build  
docker compose build -f docker-compose.prod.yml --no-cache  
```

## 4.2 Start Containers

```bash
docker compose up  
docker compose up -p chess_web -f docker-compose.prod.yml --env-file .env 
```

## 4.3 Stop Containers

```bash
docker compose down  
docker compose down -v  
```

## 4.4 Check Running Containers and Volumes

```bash
docker ps  
docker volume ls  
```
	
# 5. Admin Website

## 5.1 Restore Database Paths

```bash
/CHESS_WEB/CHESSApp_dev_backups   # chr21
/CHESS_WEB/CHESSApp_prod_backups  # all
/CHESS_WEB/CHESSApp_data  
```
## 5.2 Data Directory

**DO NOT SET**

