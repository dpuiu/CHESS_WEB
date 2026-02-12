# CHESS_WEB Multi-container Setup

**Author:** Daniela Puiu  
**Last Update:** 2026-02-12  
**Topic:** [Docker Compose](https://docs.docker.com/compose/) setup for \
  [CHESS_WEB](https://github.com/alevar/CHESS_WEB)

# 1. Files

## 1.1 Docker Compose YAML Files

- `docker-compose.yml` : Main file; production code  
- `docker-compose.dev.*.yml` : Additional development/production; builds   

## 1.2 Dockerfiles  

- `CHESSApp_back/Dockerfile` : Backend   
- `CHESSApp_front_admin/Dockerfile` : Admin frontend  
- `Dockerfile.public` : Public frontend + backend  
- `CHESSApp_front_public/Dockerfile` : Public frontend (outdated)  

## 1.3 Other Files (included)

- `.env` : Contains MySQL users, passwords, and service ports  
- `my_custom.cnf` : MySQL (mysqld) configuration  
- `db_init.sh` : Creates the MySQL database & users and sets permissions  
- `CHESSApp_DB/chess.db.schema.mysql.sql`:  Creates the MySQL database tables  

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
- `public`  

### 2.1.2 Development (5)

- `mysql`  
- `backend_admin`  
- `frontend_admin`  
- `backend_public`  
- `frontend_public`  

## 2.2 Volumes

### 2.2.1 Production

2 Volumes
- `mysql_data`  
- `./CHESS_WEB`   : bind-mount database backup and genome files

### 2.2.2 Development

1 Volume
- `mysql_data`  

# 3. CHESS Database

## 3.1 Download Copies

Test vs All
```bash
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_dev_backups.tgz
wget ftp://ftp.ccb.jhu.edu/pub/dpuiu/CHESS_WEB/CHESSApp_prod_backups.tgz
```

## 3.2 Check File Sizes

```bash
du -hs *
  96M   CHESSApp_dev_backups.tgz
  6.9G  CHESSApp_prod_backups.tgz
```

## 3.3 Extract Archives 

To ./CHESS_WEB/ directory which will map to /CHESS_WEB !!!

```bash
tar -xzvf CHESSApp_dev_backups.tgz
tar -xzvf CHESSApp_prod_backups.tgz

tree -L 2 ./CHESS_WEB/
./CHESS_WEB/
├── CHESSApp_data
├── CHESSApp_dev_backups
│   └── backup_2025-12-21_22-53-30
└── CHESSApp_prod_backups
    └── backup_2026-01-22_13-42-15
```

# 4. Docker Commands

> Note: default vs custom options

## 4.1 Build Containers

```bash
docker compose build  
docker compose build -f docker-compose.yml --no-cache --parallel
```

## 4.2 Start Containers

```bash
docker compose up  
docker compose up -p chess_web -f docker-compose.yml --env-file .env -d
```

## 4.2 Start Select Containers

```bash
docker compose up mysql backend_admin frontend_admin
docker compose up mysql public
```

## 4.3 Check Images & Running Containers

```bash
docker images                                                                                                                                                                           >
  IMAGE                                    ID             DISK USAGE   CONTENT SIZE   EXTRA
  dpuiu2/chess_web-backend:latest          7c64654977a7        937MB             0B    U   
  dpuiu2/chess_web-frontend_admin:latest   615b5b222119        605MB             0B    U   
  dpuiu2/chess_web-public:latest           d1188e0758ea        967MB             0B    U   
  mysql:8.0                                272f5b15e83b        786MB             0B    U   

docker ps --no-trunc | cut -c68-
  IMAGE                                    COMMAND                                                                      CREATED          STATUS                   PORTS                   >
  dpuiu2/chess_web-public:latest           "/opt/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 600 app_public:app"   17 minutes ago   Up 6 minutes             0.0.0.0:5000->5000/tcp, >
  dpuiu2/chess_web-backend:latest          "/opt/venv/bin/gunicorn -w 4 -b 0.0.0.0:5001 --timeout 1200 app_admin:app"   17 minutes ago   Up 6 minutes             5000/tcp, 0.0.0.0:5001->>
  dpuiu2/chess_web-frontend_admin:latest   "docker-entrypoint.sh npm run dev -- --host 0.0.0.0 --port 5112"             17 minutes ago   Up 6 minutes             0.0.0.0:5112->5112/tcp, >
  mysql:8.0                                "docker-entrypoint.sh mysqld"                                                17 minutes ago   Up 6 minutes (healthy)   0.0.0.0:3306->3306/tcp, >
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

```bash
IP="localhost" # or DNS
http://localhost:5112/
```
## 5.1 Restore Database Paths

```bash
/CHESS_WEB/CHESSApp_prod_backups/backup_2026-01-22_13-42-15/ # all chr
/CHESS_WEB/CHESSApp_dev_backups/backup_2025-12-21_22-53-30/  # chr21 (test)
/CHESS_WEB/CHESSApp_data
```
## 5.2 Data Directory

**DO NOT SET**

# 5. Public Website

```bash
IP="localhost" # or DNS
http://localhost:5000/chess_app/
```
