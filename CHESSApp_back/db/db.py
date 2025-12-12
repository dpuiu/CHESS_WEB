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
    """Initialize data directory paths from database configuration."""
    global DATA_BASE_DIR, FASTA_FILES_DIR, SOURCE_FILES_DIR, TEMP_FILES_DIR
    
    try:
        res = db.session.execute(text("SELECT data_dir FROM database_configuration;")).fetchone()
        if not res or not res.data_dir:
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