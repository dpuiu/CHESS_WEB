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
    
    # Get origins from app config (already processed from env or defaults in config/__init__.py)
    origins = app.config.get('CORS_ORIGINS', [])
    
    if app_type == 'public':
        # Public app: Allow access from configured frontend domains
        CORS(app, 
             origins=origins,
             methods=['GET', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'Range'],
             expose_headers=['Content-Range', 'Content-Length', 'Accept-Ranges'],
             supports_credentials=True)
        
        print(f"🌐 CORS configured for public app with origins: {origins}")
        
    elif app_type == 'admin':
        # Admin app: Allow configured origins
        CORS(app, 
             origins=origins,
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'Range'],
             expose_headers=['Content-Range', 'Content-Length', 'Accept-Ranges'],
             supports_credentials=True)
        
        print(f"🔒 CORS configured for admin app with origins: {origins}")
        
    else:
        raise ValueError(f"Invalid app_type: {app_type}. Must be 'public' or 'admin'")

 