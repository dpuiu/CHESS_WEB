"""
Middleware utilities
Common middleware functions and decorators
"""

from functools import wraps
from flask import request, jsonify, current_app
import time

def require_json(f):
    """
    Decorator to require JSON content type for requests
    
    Args:
        f: Function to decorate
        
    Returns:
        Decorated function
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        return f(*args, **kwargs)
    return decorated_function

def validate_required_fields(required_fields: list):
    """
    Decorator to validate required fields in JSON request body
    
    Args:
        required_fields: List of required field names
        
    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing_fields
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_content_length(max_size_mb: int = 10):
    """
    Decorator to validate request content length
    
    Args:
        max_size_mb: Maximum content length in MB
        
    Returns:
        Decorator function
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.content_length and request.content_length > max_size_bytes:
                return jsonify({
                    'error': 'Request too large',
                    'message': f'Request size exceeds {max_size_mb}MB limit'
                }), 413
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
