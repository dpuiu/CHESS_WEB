"""
CORS (Cross-Origin Resource Sharing) middleware
Handles different CORS configurations for public and admin applications
"""

import os
from flask_cors import CORS
from flask import Flask
from typing import List

def setup_cors(app: Flask, app_type: str = 'public'):
    """
    Setup CORS for the Flask application
    
    Args:
        app: Flask application instance
        app_type: Type of application ('public' or 'admin')
    """
    
    # Get additional origins from environment variable (comma-separated)
    extra_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
    extra_origins = [o.strip() for o in extra_origins_env.split(',') if o.strip()]
    
    if app_type == 'public':
        # Public app: Allow access from public frontend domains
        origins = [
            'http://localhost:5112',
            'http://127.0.0.1:5112',
            'http://localhost:5113',
            'http://127.0.0.1:5113',
        ] + extra_origins
        
        CORS(app, 
             origins=origins,
             methods=['GET', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'Range'],
             expose_headers=['Content-Range', 'Content-Length', 'Accept-Ranges'],
             supports_credentials=True)
        
        print(f"🌐 CORS configured for public app with origins: {origins}")
        
    elif app_type == 'admin':
        # Admin app: Allow localhost + any extra configured origins
        origins = [
            'http://localhost:5112',
            'http://127.0.0.1:5112',
        ] + extra_origins
        
        CORS(app, 
             origins=origins,
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'Range'],
             expose_headers=['Content-Range', 'Content-Length', 'Accept-Ranges'],
             supports_credentials=True)
        
        print(f"🔒 CORS configured for admin app with origins: {origins}")
        
    else:
        raise ValueError(f"Invalid app_type: {app_type}. Must be 'public' or 'admin'")

def get_cors_origins(app_type: str) -> List[str]:
    """
    Get the list of allowed CORS origins for a given app type
    
    Args:
        app_type: Type of application ('public' or 'admin')
        
    Returns:
        List of allowed origins
    """
    if app_type == 'public':
        return [
            'http://localhost:5112',
            'http://127.0.0.1:5112',
        ]
    elif app_type == 'admin':
        return [
            'http://localhost:5112',
            'http://127.0.0.1:5112',
        ]
    else:
        raise ValueError(f"Invalid app_type: {app_type}. Must be 'public' or 'admin'") 