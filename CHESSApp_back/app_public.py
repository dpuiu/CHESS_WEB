import os
from flask import Flask, render_template, send_from_directory
from routes.public_routes import public_bp
from db.db import db, initialize_paths
from config import Config
from middleware import setup_cors

# Path to the built frontend (optional - only needed for production)
FRONTEND_DIST = os.environ.get('CHESS_FRONTEND_DIST')

# Configure Flask app based on whether we're serving static files
if FRONTEND_DIST:
    app = Flask(__name__, 
                static_folder=os.path.join(FRONTEND_DIST, 'assets'),
                static_url_path='/chess_app/assets',
                template_folder=FRONTEND_DIST)
else:
    # Development mode - frontend served by Vite dev server
    app = Flask(__name__)
app.config.from_object(Config)

# Setup middleware
setup_cors(app, app_type='public')

db.init_app(app)

# Initialize data directory paths from database configuration
with app.app_context():
    initialize_paths()

# Register only public routes (read-only)
app.register_blueprint(public_bp, url_prefix='/api/public')

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return "404 error", 404

@app.errorhandler(500)
def server_error(e):
    return 'An internal error occurred [app_public.py] %s' % e, 500

# ============================================================================
# MAIN ROUTES
# ============================================================================

@app.route('/')
def index():
    """Serve the public application"""
    if FRONTEND_DIST:
        return render_template('index.html')
    return {'message': 'CHESS API is running. Frontend served by Vite dev server in development mode.'}

@app.route('/chess_app')
@app.route('/chess_app/')
@app.route('/chess_app/<path:path>')
def serve_frontend(path=''):
    """Serve the frontend application at /chess_app"""
    if not FRONTEND_DIST:
        return {'message': 'Frontend not configured. Set CHESS_FRONTEND_DIST for production.'}, 404
    if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    return render_template('index.html')

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'service': 'CHESS Web App - public (Read-Only)'}

@app.route('/middleware/stats')
def middleware_stats():
    """Get middleware statistics"""
    return {
        'cors': 'enabled',
        'app_type': 'public',
        'message': 'Simplified middleware - CORS only'
    }

if __name__ == '__main__':
    import argparse
    import os
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='CHESS Web App - Public Interface')
    parser.add_argument('--port', '-p', type=int, default=None,
                       help='Port to run the public server on (default: 5000)')
    parser.add_argument('--host', type=str, default="0.0.0.0",
                       help='Host to bind to (default: 0.0.0.0 for external access)')
    args = parser.parse_args()
    
    # Determine port: command line > environment variable > default
    port = args.port or int(os.environ.get('CHESS_PUBLIC_PORT', 5000))
    host = args.host or os.environ.get('CHESS_PUBLIC_HOST', '0.0.0.0')
    
    print(f"🚀 Starting CHESS Web App - Public (Read-Only) on {host}:{port}")
    print("📖 This application provides read-only access to the database")
    print(f"🌐 Access the public frontend at: http://{host}:{port}")
    
    app.run(host=host, port=port, debug=True) 