#!/usr/bin/env python3
"""
Test script to verify the installation and dependencies.
Run this script to check if all required packages are installed correctly.
"""

import sys
import importlib

def test_import(module_name, package_name=None):
    """Test if a module can be imported."""
    try:
        importlib.import_module(module_name)
        print(f"✅ {package_name or module_name} - OK")
        return True
    except ImportError as e:
        print(f"❌ {package_name or module_name} - FAILED: {e}")
        return False

def main():
    """Main test function."""
    print("🧪 Testing Pose Tracking Flask Application Installation")
    print("=" * 60)
    
    # Test Python version
    python_version = sys.version_info
    if python_version >= (3, 8):
        print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} - OK")
    else:
        print(f"❌ Python {python_version.major}.{python_version.minor}.{python_version.micro} - FAILED (requires 3.8+)")
        return False
    
    print("\n📦 Testing required packages:")
    print("-" * 40)
    
    # Required packages
    packages = [
        ('flask', 'Flask'),
        ('cv2', 'OpenCV'),
        ('numpy', 'NumPy'),
        ('ultralytics', 'Ultralytics'),
        ('torch', 'PyTorch'),
        ('PIL', 'Pillow'),
        ('pandas', 'Pandas'),
    ]
    
    all_passed = True
    for module, name in packages:
        if not test_import(module, name):
            all_passed = False
    
    print("\n🔍 Testing YOLOv8 model:")
    print("-" * 40)
    
    try:
        from ultralytics import YOLO
        model = YOLO("yolov8n-pose.pt")
        print("✅ YOLOv8 Pose Model - OK")
    except Exception as e:
        print(f"❌ YOLOv8 Pose Model - FAILED: {e}")
        all_passed = False
    
    print("\n📁 Testing file structure:")
    print("-" * 40)
    
    import os
    required_files = [
        'app.py',
        'config.py',
        'run.py',
        'requirements.txt',
        'templates/base.html',
        'templates/index.html',
        'static/css/style.css',
        'static/js/main.js'
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} - OK")
        else:
            print(f"❌ {file_path} - MISSING")
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All tests passed! The application is ready to run.")
        print("Run 'python run.py' to start the Flask application.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("Run 'pip install -r requirements.txt' to install missing packages.")
    print("=" * 60)
    
    return all_passed

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
