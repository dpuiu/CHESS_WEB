# Config package initialization
import os

class Config:
    """Legacy configuration class for backward compatibility"""
    
    # Flask settings
    # Parse FLASK_DEBUG as boolean (1, true, True)
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    
    # File upload settings for large FASTA files
    MAX_CONTENT_LENGTH = 50000 * 1024 * 1024  # 50GB max file size
    UPLOAD_TIMEOUT = 10800  # 3 hour timeout for uploads
    
    # Database settings for MySQL
    CHESSDB_MYSQL_BASE = os.getenv("CHESSDB_MYSQL_BASE", "mysql")
    CHESSDB_SOCKET= os.getenv("CHESSDB_SOCKET", "")
    CHESSDB_HOST = os.getenv("CHESSDB_HOST", "")
    CHESSDB_NAME = os.getenv("CHESSDB_NAME", "")
    CHESSDB_USER = os.getenv("CHESSDB_USER", "")
    CHESSDB_PASS = os.getenv("CHESSDB_PASS", "")

    if CHESSDB_HOST == "" or CHESSDB_NAME == "" or CHESSDB_USER == "" or CHESSDB_PASS == "":
        raise ValueError("Database configuration is incomplete. Please set CHESSDB_HOST, CHESSDB_NAME, CHESSDB_USER, and CHESSDB_PASS environment variables.")
    
    # Build the database URI for MySQL
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{CHESSDB_USER}:{CHESSDB_PASS}@{CHESSDB_HOST}/{CHESSDB_NAME}"
    
    # Flask-SQLAlchemy settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS settings
    _cors_env = os.getenv('CORS_ALLOWED_ORIGINS', '')
    if _cors_env:
        CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
    else:
        # Default development origins
        CORS_ORIGINS = ['http://localhost:5112', 'http://localhost:5113']

__all__ = [
    'Config',
] 