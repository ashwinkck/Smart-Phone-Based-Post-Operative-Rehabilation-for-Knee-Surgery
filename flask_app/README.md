# Pose Tracking Flask Application

A comprehensive web application for real-time pose estimation and leg angle tracking using YOLOv8 and Flask. This application provides both live camera tracking and image upload processing capabilities.

## Features

- 🎥 **Live Camera Tracking**: Real-time pose estimation from webcam feed
- 📊 **Angle Measurement**: Precise knee angle calculation with smoothing
- 🖼️ **Image Upload**: Process static images for pose analysis
- 📈 **Data Export**: Export angle data to CSV format
- 🎨 **Modern UI**: Responsive web interface with Bootstrap
- ⚙️ **Configurable**: Switch between left and right leg tracking

## Screenshots

The application features a clean, modern interface with:
- Live video feed display
- Real-time angle measurements
- Control buttons for tracking start/stop
- Image upload functionality
- Data export capabilities

## Installation

### Prerequisites

- Python 3.8 or higher
- Webcam (for live tracking)
- Modern web browser

### Setup

1. **Clone or download the application files**

2. **Navigate to the flask_app directory**
   ```bash
   cd flask_app
   ```

3. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Download YOLOv8 model (if not already present)**
   The application will automatically download the YOLOv8 pose model on first run, or you can manually place `yolov8n-pose.pt` in the flask_app directory.

## Usage

### Starting the Application

1. **Run the Flask application**
   ```bash
   python app.py
   ```

2. **Open your web browser**
   Navigate to `http://localhost:5000`

3. **Allow camera access**
   When prompted, allow the browser to access your webcam for live tracking.

### Using the Application

#### Live Tracking
1. Click **"Start Tracking"** to begin real-time pose estimation
2. Select **"Left Leg"** or **"Right Leg"** to choose which leg to track
3. Position yourself in front of the camera
4. View real-time angle measurements in the sidebar
5. Click **"Stop Tracking"** to end the session

#### Image Upload
1. Click **"Choose File"** and select an image
2. Click **"Process Image"** to analyze the pose
3. View the processed image with angle measurements

#### Data Export
1. Click **"Export Data"** to download angle measurements as CSV

## API Endpoints

The application provides several REST API endpoints:

- `GET /` - Main application page
- `GET /video_feed` - Live video stream
- `POST /start_tracking` - Start pose tracking
- `POST /stop_tracking` - Stop pose tracking
- `POST /set_leg` - Set leg to track (left/right)
- `GET /get_angle` - Get current angle data
- `POST /upload_image` - Process uploaded image
- `GET /export_data` - Export data as CSV

## Configuration

### Model Configuration
- The application uses YOLOv8n-pose model by default
- Model file: `yolov8n-pose.pt`
- You can replace this with custom trained models

### Tracking Parameters
- **Buffer Size**: 30 frames for angle smoothing
- **Angle Threshold**: 3.0 degrees minimum change for stable angle update
- **Update Frequency**: 100ms for real-time display

### Camera Settings
- Default camera index: 0
- Resolution: Auto-detected
- Frame rate: Depends on camera capabilities

## File Structure

```
flask_app/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   ├── base.html         # Base template
│   └── index.html        # Main page template
├── static/
│   ├── css/
│   │   └── style.css     # Custom styles
│   ├── js/
│   │   └── main.js       # JavaScript functionality
│   └── uploads/          # Uploaded images storage
└── yolov8n-pose.pt       # YOLOv8 pose model (auto-downloaded)
```

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Check camera permissions in browser
   - Ensure no other applications are using the camera
   - Try refreshing the page

2. **Model loading errors**
   - Ensure internet connection for model download
   - Check if `yolov8n-pose.pt` exists in the directory
   - Verify ultralytics package is installed correctly

3. **Performance issues**
   - Close other applications using the camera
   - Reduce browser window size
   - Check system resources (CPU/GPU usage)

4. **Import errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version compatibility
   - Verify virtual environment is activated

### Browser Compatibility

- Chrome 80+ (recommended)
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Adding New Features

1. **Backend**: Modify `app.py` to add new routes and functionality
2. **Frontend**: Update templates in `templates/` directory
3. **Styling**: Modify `static/css/style.css` for visual changes
4. **JavaScript**: Update `static/js/main.js` for client-side functionality

### Testing

Run the application in development mode:
```bash
python app.py
```

The application will run with debug mode enabled, providing detailed error messages and automatic reloading on code changes.

## Production Deployment

For production deployment:

1. **Install production server**
   ```bash
   pip install gunicorn
   ```

2. **Run with Gunicorn**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Configure reverse proxy** (nginx recommended)
4. **Set up SSL certificates** for HTTPS
5. **Configure environment variables** for production settings

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Open an issue on the project repository

---

**Note**: This application requires a webcam for live tracking functionality. Make sure to grant camera permissions when prompted by your browser.
