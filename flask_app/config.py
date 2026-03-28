import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    
    # YOLO Model Configuration
    MODEL_PATH = os.environ.get('MODEL_PATH') or 'yolov8n-pose.pt'
    
    # Tracking Configuration
    ANGLE_BUFFER_SIZE = int(os.environ.get('ANGLE_BUFFER_SIZE', 30))
    ANGLE_THRESHOLD = float(os.environ.get('ANGLE_THRESHOLD', 3.0))
    UPDATE_INTERVAL = int(os.environ.get('UPDATE_INTERVAL', 100))  # milliseconds
    
    # Camera Configuration
    CAMERA_INDEX = int(os.environ.get('CAMERA_INDEX', 0))
    
    # Flask Configuration
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
    PORT = int(os.environ.get('FLASK_PORT', 5000))

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    FLASK_ENV = 'production'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
