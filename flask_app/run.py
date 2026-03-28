#!/usr/bin/env python3
"""
Flask application runner script.
This script provides an easy way to start the Pose Tracking application.
"""

import os
import sys
from app import app
from config import config

def main():
    """Main function to run the Flask application."""
    
    # Get configuration from environment
    config_name = os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Print startup information
    print("=" * 60)
    print("🏃 Pose Tracking Flask Application")
    print("=" * 60)
    print(f"Environment: {config_name}")
    print(f"Debug Mode: {app.config['DEBUG']}")
    print(f"Host: {app.config['HOST']}")
    print(f"Port: {app.config['PORT']}")
    print(f"Model: {app.config['MODEL_PATH']}")
    print("=" * 60)
    print("📱 Open your browser and navigate to:")
    print(f"   http://localhost:{app.config['PORT']}")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        # Run the application
        app.run(
            host=app.config['HOST'],
            port=app.config['PORT'],
            debug=app.config['DEBUG'],
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
