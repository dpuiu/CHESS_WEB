from flask_sqlalchemy import SQLAlchemy
import os
from sqlalchemy import text

# Initialize an instance of SQLAlchemy
db = SQLAlchemy()

# Global variables for data directory paths
DATA_BASE_DIR = None
FASTA_FILES_DIR = None
SOURCE_FILES_DIR = None
TEMP_FILES_DIR = None

def initialize_paths():
    """Initialize data directory paths from database configuration.
    
    This function is safe to call even if the database configuration
    is not yet set up. It will simply leave paths as None.
    """
    global DATA_BASE_DIR, FASTA_FILES_DIR, SOURCE_FILES_DIR, TEMP_FILES_DIR
    
    try:
        res = db.session.execute(text("SELECT data_dir FROM database_configuration;")).fetchone()
        if not res or not res.data_dir:
            # No configuration yet - this is OK for fresh databases
            print("INFO: Database configuration not set. Data paths will be initialized when configuration is provided.")
            return
        
        data_dir = res.data_dir.strip()
        if not os.path.isdir(data_dir):
            raise ValueError(f"Data directory does not exist: {data_dir}")
        
        DATA_BASE_DIR = data_dir
        FASTA_FILES_DIR = os.path.join(data_dir, 'fasta_files')
        SOURCE_FILES_DIR = os.path.join(data_dir, 'source_files')
        TEMP_FILES_DIR = os.path.join(data_dir, 'temp_files')
        
        # Create directories
        ensure_data_directories()
        print(f"INFO: Data paths initialized from: {data_dir}")
        
    except Exception as e:
        raise RuntimeError(f"Failed to load data directory configuration: {e}")

def ensure_data_directories():
    """Create all data directories if they don't exist."""
    if DATA_BASE_DIR is None:
        raise RuntimeError("Paths not initialized. Call initialize_paths() first.")
    
    directories = [
        DATA_BASE_DIR,
        FASTA_FILES_DIR,
        SOURCE_FILES_DIR,
        TEMP_FILES_DIR
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

def get_fasta_files_dir():
    """Get the fasta files directory."""
    return FASTA_FILES_DIR

def get_source_files_dir():
    """Get the source files directory."""
    return SOURCE_FILES_DIR

def get_temp_files_dir():
    """Get the temp files directory."""
    return TEMP_FILES_DIR

def get_data_base_dir():
    """Get the base data directory."""
    return DATA_BASE_DIR

def is_paths_configured():
    """Check if data paths have been configured."""
    return DATA_BASE_DIR is not None

# ============================================================================
# PATH CONVERSION UTILITIES
# ============================================================================
# These functions handle conversion between relative paths (stored in DB)
# and absolute paths (used for file operations). This makes backups portable
# since only the data_dir in database_configuration needs to be updated.

def to_relative_path(absolute_path: str) -> str:
    """
    Convert an absolute file path to a relative path for database storage.
    
    Args:
        absolute_path: Full absolute path to the file
    
    Returns:
        Relative path from the data base directory (e.g., 'fasta_files/file.fasta')
    
    Raises:
        RuntimeError: If data paths are not initialized (database not configured)
    """
    if DATA_BASE_DIR is None:
        raise RuntimeError("Data paths not configured. Please set the data directory in Database Management settings.")
    
    # Normalize paths for comparison
    abs_path = os.path.normpath(absolute_path)
    base_dir = os.path.normpath(DATA_BASE_DIR)
    
    # Check if the path is under our data directory
    if abs_path.startswith(base_dir):
        # Return path relative to DATA_BASE_DIR
        rel_path = os.path.relpath(abs_path, base_dir)
        return rel_path
    
    # If path is not under data directory, just return the filename
    # and let the caller handle placement
    return os.path.basename(absolute_path)

def to_absolute_path(relative_path: str) -> str:
    """
    Convert a relative file path (from DB) to an absolute path for file operations.
    
    Args:
        relative_path: Relative path stored in database (e.g., 'fasta_files/file.fasta')

    Returns:
        Full absolute path to the file
    
    Raises:
        RuntimeError: If data paths are not initialized (database not configured)
    """
    if DATA_BASE_DIR is None:
        raise RuntimeError("Data paths not configured. Please set the data directory in Database Management settings.")
    
    # If already absolute, return as-is (for backward compatibility during migration)
    if os.path.isabs(relative_path):
        return relative_path
    
    return os.path.join(DATA_BASE_DIR, relative_path)