from flask import Flask, render_template
from db.db import db, initialize_paths
from config import Config
from middleware import setup_cors

app = Flask(__name__)
app.config.from_object(Config)

# Setup middleware
setup_cors(app, app_type='admin')

# Configure file upload settings for admin operations
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
app.config['UPLOAD_TIMEOUT'] = Config.UPLOAD_TIMEOUT

db.init_app(app)

# Initialize data directory paths from database configuration
with app.app_context():
    initialize_paths()

# Now import routes after paths are initialized
from routes.admin_routes import admin_bp
from routes.public_routes import public_bp

# Register only admin routes (full access)
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(public_bp, url_prefix='/api/public')

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return "404 error", 404

@app.errorhandler(500)
def server_error(e):
    return 'An internal error occurred [app_admin.py] %s' % e, 500

# ============================================================================
# ADMIN ROUTES
# ============================================================================

@app.route('/')
def admin_index():
    """Serve the admin application"""
    return render_template('admin.html')

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'service': 'CHESS Web App - Admin (Full Access)'}

@app.route('/middleware/stats')
def middleware_stats():
    """Get middleware statistics"""
    return {
        'cors': 'enabled',
        'app_type': 'admin',
        'message': 'Simplified middleware - CORS only'
    }

if __name__ == '__main__':
    import argparse
    import os
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='CHESS Web App - Admin Interface')
    parser.add_argument('--port', '-p', type=int, default=None, 
                       help='Port to run the admin server on (default: 5001)')
    parser.add_argument('--host', type=str, default="127.0.0.1",
                       help='Host to bind to (default: 127.0.0.1 for security)')
    args = parser.parse_args()
    
    # Determine port: command line > environment variable > default
    port = args.port or int(os.environ.get('CHESS_ADMIN_PORT', 5001))
    host = args.host or os.environ.get('CHESS_ADMIN_HOST', '127.0.0.1')
    
    print(f"🔧 Starting CHESS Web App - Admin (Full Access) on {host}:{port}")
    print("⚠️  This application provides full database access - use only locally!")
    print(f"🔒 Access the admin dashboard at: http://{host}:{port}")
    print("📝 Remember: This should NEVER be exposed to external users")
    
    # Use configuration for debug mode
    debug_mode = app.config.get('FLASK_DEBUG', False)
    if debug_mode:
        print("🐞 Debug mode is ON")
    
    app.run(host=host, port=port, debug=debug_mode)  # Only bind to localhost for security 