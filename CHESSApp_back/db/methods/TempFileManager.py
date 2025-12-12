import os
import tempfile
import threading
import atexit
import uuid
from typing import Set, Optional, Dict
from contextlib import contextmanager
from db.db import get_temp_files_dir

class TempFileManager:
    """
    A simple centralized temp file management system.
    
    Features:
    - Thread-safe singleton pattern
    - Automatic cleanup on application exit
    - Context manager support
    - Essential cleanup methods
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self._temp_files: Set[str] = set()
            self._temp_names: Dict[str, str] = {}  # name -> file_path mapping
            self._lock = threading.Lock()
            
            # Register cleanup on application exit
            atexit.register(self.cleanup_all)
            self._initialized = True
    
    def create_temp_filename(self, name: str, dir: Optional[str] = None) -> str:
        """
        Create a new temp filename (doesn't create the actual file).
        
        Args:
            name: Identifier for the temp file
            dir: Directory to create temp file in
            
        Returns:
            The temp file path
        """
        # Generate random filename
        random_filename = f"temp_{uuid.uuid4().hex}"
        temp_path = os.path.join(dir or get_temp_files_dir(), random_filename)
        
        # Add to tracking
        with self._lock:
            self._temp_files.add(temp_path)
            self._temp_names[name] = temp_path
        
        return temp_path
    
    def add_temp_file(self, file_path: str, name: str) -> str:
        """
        Add an existing temp file to tracking.
        
        Args:
            file_path: Path to the temp file
            name: Identifier for the temp file
            
        Returns:
            The file path that was added
        """
        with self._lock:
            self._temp_files.add(file_path)
            self._temp_names[name] = file_path
        return file_path
    
    def cleanup_file(self, file_path: str) -> bool:
        """
        Remove a temp file from tracking and delete it from disk.
        
        Args:
            file_path: Path to the temp file
            
        Returns:
            True if file was cleaned up, False if it wasn't tracked or couldn't be deleted
        """
        with self._lock:
            if file_path in self._temp_files:
                self._temp_files.remove(file_path)
                # Remove from names mapping
                for name, path in list(self._temp_names.items()):
                    if path == file_path:
                        del self._temp_names[name]
        
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
            return True
        except (OSError, IOError) as e:
            print(f"Warning: Could not delete temp file {file_path}: {str(e)}")
            return False
    
    def cleanup_all(self) -> int:
        """
        Clean up all tracked temp files.
        
        Returns:
            Number of files successfully cleaned up
        """
        cleaned_count = 0
        with self._lock:
            files_to_clean = list(self._temp_files)
            self._temp_files.clear()
            self._temp_names.clear()
        
        for file_path in files_to_clean:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                cleaned_count += 1
            except (OSError, IOError) as e:
                print(f"Warning: Could not delete temp file {file_path}: {str(e)}")
        
        return cleaned_count
    
    def get_temp_files(self) -> Set[str]:
        """Get all currently tracked temp files."""
        with self._lock:
            return self._temp_files.copy()
    
    def get_temp_file_by_name(self, name: str) -> Optional[str]:
        """Get temp file path by name."""
        with self._lock:
            return self._temp_names.get(name)
    
    def count_temp_files(self) -> int:
        """Get the number of currently tracked temp files."""
        with self._lock:
            return len(self._temp_files)
    
    @contextmanager
    def managed_temp_file(self, name: str, dir: Optional[str] = None):
        """
        Context manager for creating and managing a temp file.
        
        Args:
            name: Identifier for the temp file
            dir: Directory to create temp file in
            
        Yields:
            The path to the created temp file
        """
        temp_path = self.create_temp_filename(name, dir)
        
        yield temp_path

# Global instance
temp_file_manager = TempFileManager()

def get_temp_file_manager() -> TempFileManager:
    """Get the global temp file manager instance."""
    return temp_file_manager
