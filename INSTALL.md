# CHESS Web Application - Installation and Setup Guide

This guide covers the complete installation and setup of the CHESS Web Application on Linux systems. The application consists of:

- **Backend (Flask)**: Two Flask applications serving API endpoints
  - `app_public.py` - Public read-only API (port 5000)
  - `app_admin.py` - Admin API with full access (port 5001)
- **Frontend (React + Vite)**: Two React applications
  - `CHESSApp_front_public` - Public-facing web interface (port 5113)
  - `CHESSApp_front_admin` - Admin interface (port 5112)
- **Database (MySQL)**: MySQL 8.x database for storing CHESS annotation data

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [System Dependencies Installation](#2-system-dependencies-installation)
3. [MySQL Database Setup](#3-mysql-database-setup)
4. [Backend Setup](#4-backend-setup)
5. [Frontend Setup](#5-frontend-setup)
6. [Running the Application](#6-running-the-application)
7. [Environment Configuration](#7-environment-configuration)
8. [Production Deployment](#8-production-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Ensure you have the following installed or available:

- **Operating System**: Linux (Ubuntu)

---

## 2. System Dependencies Installation

### 2.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Python 3.10+

```bash
# Python
sudo apt install -y python3 python3-pip python3-venv python3-dev
# Build tools
sudo apt install -y build-essential git curl wget


# verify installation
python3 --version
```

### 2.3 Install Node.js (v18+) and npm

```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

---

## 3. MySQL Database Setup

### 3.1 Install MySQL 8.x

#### Option A: Using System Package Manager

```bash
# Ubuntu/Debian
sudo apt install -y mysql-server mysql-client libmysqlclient-dev

# CentOS/RHEL
sudo yum install -y mysql-server mysql-devel

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 3.2 Secure MySQL Installation

```bash
# Run security script (for system installation)
sudo mysql_secure_installation

# Inside MySQL
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_secure_password';
FLUSH PRIVILEGES;
```

### 3.3 Create Database and Users

```bash
# Connect to MySQL
mysql -u root -p

# Create the CHESS database
CREATE SCHEMA IF NOT EXISTS CHESS_DB;

# Create a read-only user for the public backend (app_public.py)
CREATE USER 'chess_public'@'localhost' IDENTIFIED BY 'your_public_password';
GRANT SELECT ON CHESS_DB.* TO 'chess_public'@'localhost';

# Create an admin user with full privileges for the admin backend (app_admin.py)
CREATE USER 'chess_admin'@'localhost' IDENTIFIED BY 'your_admin_password';
GRANT ALL PRIVILEGES ON CHESS_DB.* TO 'chess_admin'@'localhost';

FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 3.4 Import Database Schema

```bash
# Navigate to database schema directory
cd /path/to/CHESS_WEB/CHESSApp_DB

# Import the schema (use admin user)
mysql -u chess_admin -p CHESS_DB < chess.db.schema.mysql.sql
```

---

## 4. Backend Setup

### 4.1 Create Python Virtual Environment

```bash
# Navigate to backend directory
cd /path/to/CHESS_WEB/CHESSApp_back

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### 4.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4.3 Environment Variables

The backend requires database connection settings via environment variables. Export these before running the backend servers.

**For Public Backend (read-only access):**
```bash
export CHESSDB_HOST="localhost"
export CHESSDB_NAME="CHESS_DB"
export CHESSDB_USER="chess_public"
export CHESSDB_PASS="your_public_password"
export FLASK_DEBUG="0"

# Optional: If using custom MySQL installation
# export CHESSDB_SOCKET="/path/to/mysql.sock"
# export CHESSDB_MYSQL_BASE="/path/to/mysql"
```

**For Admin Backend (full access):**
```bash
export CHESSDB_HOST="localhost"
export CHESSDB_NAME="CHESS_DB"
export CHESSDB_USER="chess_admin"
export CHESSDB_PASS="your_admin_password"
export FLASK_DEBUG="1"  # Set to "0" for production

# Optional: If using custom MySQL installation
# export CHESSDB_SOCKET="/path/to/mysql.sock"
# export CHESSDB_MYSQL_BASE="/path/to/mysql"
```

### 4.4 Setup Data Directories

The application requires specific data directories for storing FASTA files, source files, and temporary files:

```bash
# Create storage directory
mkdir -p /path/to/chess_storage

# Set appropriate permissions
chmod -R 755 /path/to/chess_storage
```

The data directory path is later configured through the database `database_configuration` table via the admin panel.

---

## 5. Frontend Setup

### 5.1 Public Frontend Setup

```bash
# Navigate to public frontend directory
cd /path/to/CHESS_WEB/CHESSApp_front_public

# Install dependencies
npm install
```

### 5.2 Admin Frontend Setup

```bash
# Navigate to admin frontend directory
cd /path/to/CHESS_WEB/CHESSApp_front_admin

# Install dependencies
npm install
```

---

## 6. Database Setup with the Admin Dashboard

### 6.1 Start the Admin Backend

```bash
cd /path/to/CHESS_WEB/CHESSApp_back
source venv/bin/activate

# Set admin credentials (full database access)
export CHESSDB_HOST=localhost
export CHESSDB_NAME=CHESS_DB
export CHESSDB_USER=chess_admin
export CHESSDB_PASS=your_admin_password
# export CHESSDB_SOCKET=/path/to/mysql.sock        # Optional: custom socket
# export CHESSDB_MYSQL_BASE=/path/to/mysql          # Optional: custom MySQL path

flask --app app_admin run --port 5001
```

### 6.2 Start Admin Dashboard Frontend

```bash
cd /path/to/CHESS_WEB/CHESSApp_front_admin
npm run dev -- --host 0.0.0.0 --port 5112
```

### 6.3 Access the Admin Dashboard

Open your browser and navigate to: http://localhost:5112

### 6.4 Building the Database via Admin Panel

If you already have a backup of the database created, you can navigate over to the database card in the dashboard and restore the database from the backup by specifying the path to the backup location.

If a backup is not available, or you want to start building from scratch - perform a hard reset of the database via the database card of the dashbpard and proceed to add information one card at a time: Organism->Assembly->Assembly Files->Nomenclatures->Sources->Source versions->Source Files.

Lastly, for the public facing application to know what data to display by default, you must create a configuration and set it as active. This will create a set of values to be used by default when launching the public facing interface.

---

## 7. Running the Public Interface

### 7.1 Start the Public Backend

```bash
cd /path/to/CHESS_WEB/CHESSApp_back
source venv/bin/activate

# Set public credentials (read-only database access)
export CHESSDB_HOST=localhost
export CHESSDB_NAME=CHESS_DB
export CHESSDB_USER=chess_public
export CHESSDB_PASS=your_public_password
# export CHESSDB_SOCKET=/path/to/mysql.sock        # Optional: custom socket
# export CHESSDB_MYSQL_BASE=/path/to/mysql          # Optional: custom MySQL path

flask --app app_public run --port 5000
```

### 7.2 Start Public Frontend

```bash
cd /path/to/CHESS_WEB/CHESSApp_front_public
npm run dev -- --host 0.0.0.0 --port 5113
```

### 7.3 Access the Public Interface

Open your browser and navigate to: http://localhost:5113

---

*Last updated: December 2025*