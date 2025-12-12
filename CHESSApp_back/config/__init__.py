# Config package initialization
import os

class Config:
    """Legacy configuration class for backward compatibility"""
    
    # Flask settings
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "0")
    
    # File upload settings for large FASTA files
    MAX_CONTENT_LENGTH = 50000 * 1024 * 1024  # 50GB max file size
    UPLOAD_TIMEOUT = 10800  # 3 hour timeout for uploads
    
    # Database settings for MySQL
    CHESSDB_MYSQL_BASE = os.getenv("CHESSDB_MYSQL_BASE", "mysql")
    CHESSDB_SOCKET= os.getenv("CHESSDB_SOCKET", "")
    CHESSDB_HOST = os.getenv("CHESSDB_HOST", "localhost")
    CHESSDB_NAME = os.getenv("CHESSDB_NAME", "CHESS_DB")
    CHESSDB_USER = os.getenv("CHESSDB_USER", "")
    CHESSDB_PASS = os.getenv("CHESSDB_PASS", "")
    
    # Build the database URI for MySQL
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{CHESSDB_USER}:{CHESSDB_PASS}@{CHESSDB_HOST}/{CHESSDB_NAME}"
    
    # Flask-SQLAlchemy settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CORS_ORIGINS = ['http://localhost:5112', 'http://localhost:5113']

__all__ = [
    'Config',
] 