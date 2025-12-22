from sqlalchemy import text
from db.db import db, initialize_paths
from .queries import *
from config import Config
import os
import time
import shutil
import subprocess

def update_database_config(data_dir):
    """
    Updates the database configuration and refreshes the global paths.
    """
    try:
        # delete existing data directory if changing
        if os.path.exists(data_dir):
            shutil.rmtree(data_dir)

        # Update database configuration
        if db.session.execute(text("SELECT COUNT(*) FROM database_configuration")).fetchone()[0] == 0:
            # configuration does not exist, create new one
            db.session.execute(text("INSERT INTO database_configuration (data_dir) VALUES (:data_directory)"), {"data_directory": data_dir})
            
            # delete data directory if exists
            if os.path.isdir(data_dir):
                shutil.rmtree(data_dir)
        
            # Create the main data directory if it doesn't exist
            os.makedirs(data_dir, exist_ok=True)
            
            # Create subdirectories
            subdirs = ['fasta_files', 'source_files', 'temp_files']
            for subdir in subdirs:
                os.makedirs(os.path.join(data_dir, subdir), exist_ok=True)
        else:
            # get current data directory
            current_data_dir = db.session.execute(text("SELECT data_dir FROM database_configuration;")).fetchone()[0]
            # configuration exists, update it
            db.session.execute(text("UPDATE database_configuration SET data_dir = :data_directory"), {"data_directory": data_dir})

            # check if data directory exists
            if not os.path.exists(current_data_dir):
                # create new one
                os.makedirs(data_dir)
            else:
                # move current one to the new one
                shutil.move(current_data_dir, data_dir)

            # create subdirectories
            subdirs = ['fasta_files', 'source_files', 'temp_files']
            for subdir in subdirs:
                if not os.path.exists(os.path.join(data_dir, subdir)):
                    os.makedirs(os.path.join(data_dir, subdir), exist_ok=True)

        db.session.commit()
        
        # Refresh the global data directory configuration
        initialize_paths()
        
        return {"success": True, "data": data_dir}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}

def create_backup(backup_path):
    """
    Creates a backup of the database to the specified file path.
    Uses mysqldump from the configured MySQL base path.
    Returns a dict with the status of the operation.
    """
    try:
        # Get MySQL base path and environment variables
        mysql_base = Config.CHESSDB_MYSQL_BASE
        user = Config.CHESSDB_USER
        password = Config.CHESSDB_PASS
        host = Config.CHESSDB_HOST
        db_name = Config.CHESSDB_NAME
        socket = Config.CHESSDB_SOCKET
        
        if not all([mysql_base,user, password, host, db_name]):
            return {"success": False, "message": "Missing required database configuration"}
        
        mysqldump_path = mysql_base+"dump"
        if not os.path.isfile(mysqldump_path) and mysql_base != "mysql":
            return {"success": False, "message": f"mysqldump not found at path: {mysqldump_path}"}

        os.makedirs(os.path.dirname(backup_path), exist_ok=True)

        current_timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
        backup_timed_path = os.path.join(backup_path, f"backup_{current_timestamp}/")
        if os.path.exists(backup_timed_path):
            return {"success": False, "message": f"Backup file already exists: {backup_timed_path}"}
        os.makedirs(os.path.dirname(backup_timed_path), exist_ok=True)
        
        sql_backup_file = os.path.join(backup_timed_path, "db.backup.sql")
        data_backup_dir = os.path.join(backup_timed_path, "data")

        # Run mysqldump
        dump_command = [
            mysqldump_path,
            f"--socket={socket}",
            f"-u{user}",
            f"-p{password}",
            f"-h{host}",
            "--single-transaction",
            "--routines",
            "--triggers",
            "--events",
            "--hex-blob",
            "--complete-insert",
            "--extended-insert",
            "--add-drop-database",
            "--databases",
            db_name
        ]

        print("Running command:", " ".join(dump_command))
        
        with open(sql_backup_file, 'wb') as backup_file:
            result = subprocess.run(dump_command, stdout=backup_file, stderr=subprocess.PIPE)
            if result.returncode != 0:
                return {"success": False, "message": f"mysqldump failed: {result.stderr.decode()}"}

        # now copy over all the data files - first need to get data directory from the database configuration itself
        res = db.session.execute(text("SELECT data_dir FROM database_configuration;")).fetchone()
        if not res or not res.data_dir:
            return {"success": False, "message": "Data directory not configured in database"}
        data_dir = res.data_dir.strip()
        if not os.path.isdir(data_dir):
            return {"success": False, "message": f"Data directory does not exist: {data_dir}"}
        shutil.copytree(data_dir, data_backup_dir)

        return {"success": True, "message": f"Database backup created successfully at {backup_path}", "backup_path": backup_path}
    except Exception as e:
        return {"success": False, "message": str(e)}

def restore_backup(backup_path, storage_dir_path):
    """
    Restores the database from a backup file.
    The restoration files are written in the currently specified storage directory, as sset before the restoration
    The restored database will be reconfigured to point to that storage directory.
    """
    try:
        # 1. Validate backup path
        if not os.path.exists(backup_path):
            return {"success": False, "message": f"Backup path does not exist: {backup_path}"}
        
        # 2. Get Configuration
        mysql_base = Config.CHESSDB_MYSQL_BASE or "mysql" # Default to system command if None
        user = Config.CHESSDB_USER
        password = Config.CHESSDB_PASS
        host = Config.CHESSDB_HOST
        db_name = Config.CHESSDB_NAME
        socket = Config.CHESSDB_SOCKET
        
        if not all([user, password, host, db_name]):
            return {"success": False, "message": "Missing required database configuration"}
        
        # Verify mysql executable exists if a specific path is provided
        if mysql_base != "mysql" and not os.path.isfile(mysql_base):
             return {"success": False, "message": f"mysql executable not found at: {mysql_base}"}

        # 3. Locate files
        backup_sql_file = os.path.join(backup_path, "db.backup.sql")
        backup_data_dir = os.path.join(backup_path, "data")

        if not os.path.isfile(backup_sql_file):
            return {"success": False, "message": f"Backup SQL file missing: {backup_sql_file}"}
        
        # retrieve current configuration settings
        # specifically we need the database storage/config directory to be retained from current state before restoration
        # suppose we have a backup and want to restore it on a different machine.
        # the original directory will not have existed on the new machine
        # we pass the new db_config directory to the restoration method
        
        # 4. Prepare MySQL Command
        # NOTE: We do NOT pass the password in the args list for security.
        restore_command = [
            mysql_base,
            f"-u{user}",
            f"-h{host}",
            f"-p{password}",
            db_name
        ]

        if socket != "":
            restore_command.insert(1, f"--socket={socket}")
        
        backup_sql_file = os.path.join(backup_path, "db.backup.sql")
        if not os.path.isfile(backup_sql_file):
            return {"success": False, "message": f"Backup SQL file does not exist: {backup_sql_file}"}
        backup_data_dir = os.path.join(backup_path, "data")
        if not os.path.isdir(backup_data_dir):
            return {"success": False, "message": f"Backup data directory does not exist: {backup_data_dir}"}
        
        # 5. Execute Restore
        with open(backup_sql_file, 'rb') as sql_file:
            result = subprocess.run(restore_command, stdin=sql_file, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if result.returncode != 0:
                return {"success": False, "message": f"mysql restore failed: {result.stderr.decode()}"}

        # now we need to change the database configuration to point to the new storage directory
        update_database_config(storage_dir_path)

        # Now copy over data files from backup
        if not os.path.isdir(backup_data_dir):
            return {"success": False, "message": f"Data backup directory does not exist: {backup_data_dir}"}
        
        # Get the data directory from the restored database configuration
        res = db.session.execute(text("SELECT data_dir FROM database_configuration;")).fetchone()
        if not res or not res.data_dir:
            return {"success": False, "message": "Data directory not configured in restored database"}
        data_dir = res.data_dir.strip()
        
        # copy over data files
        data_backup_dir = os.path.join(backup_path, "data")
        if not os.path.isdir(data_backup_dir):
            return {"success": False, "message": f"Data backup directory does not exist: {data_backup_dir}"}
        if os.path.exists(data_dir):
            shutil.rmtree(data_dir)
        shutil.copytree(data_backup_dir, data_dir)

        return {"success": True, "message": f"Database restored successfully from {backup_path}"}
    except Exception as e:
        return {"success": False, "message": str(e)}

def reset_database():
    """
    Deletes all data from all tables in the database. Use with caution!
    Returns a dict with the status of the operation.
    """
    try:
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 0;'))
        actual_tables = list_tables()
        
        for table in actual_tables:
            db.session.execute(text(f'TRUNCATE TABLE `{table}`;'))
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1;'))
        db.session.commit()
        return {"success": True, "message": f"Database reset successfully. Truncated {len(actual_tables)} tables."}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}

def get_table_info(table_name):
    """
    Returns information about a specific table or view including its description.
    Returns a dict with table information or error details.
    """
    try:
        result = db.session.execute(text("""
            SELECT 
                table_name,
                table_type,
                table_comment
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = :table_name
        """), {"table_name": table_name}).fetchone()
        
        if not result:
            return {
                "name": table_name,
                "type": "unknown",
                "description": "Table/view not found",
                "error": f"Table or view '{table_name}' does not exist"
            }
        
        table_type = "view" if result[1] == "VIEW" else "table"
        description = result[2] if result[2] else f"{table_type.capitalize()} {table_name}"
        
        return {
            "name": table_name,
            "type": table_type,
            "description": description
        }
    except Exception as e:
        return {
            "name": table_name,
            "type": "unknown",
            "description": "Error retrieving table info",
            "error": str(e)
        }

def clear_table(table_name):
    """
    Deletes all rows from the specified table.
    Returns a dict with the status of the operation.
    """
    try:
        db.session.execute(text(f'DELETE FROM `{table_name}`;'))
        db.session.commit()
        return {"success": True, "message": f"Table '{table_name}' cleared successfully."}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}