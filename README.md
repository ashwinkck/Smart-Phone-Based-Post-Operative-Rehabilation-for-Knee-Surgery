# OrthoPose Tracker 🦴📸

A comprehensive computer vision and web application built to analyze and track orthopedic metrics in real-time. This project leverages the **YOLOv8** pose estimation model to detect human skeletons and precisely measure dynamic joint angles, particularly focusing on knee angles (tracking interactions between the hip, knee, and ankle). 

The system provides multiple ways to analyze poses: via direct Python scripts using a local webcam feed, and through a complete **Flask web application** supporting live video streaming and static image uploads.

## 🌟 Key Features

- 🎥 **Real-Time Pose Tracking**: High-performance human pose detection utilizing the `yolov8n-pose.pt` model.
- 📐 **Dynamic Angle Measurement**: Accurately calculates both raw and stabilized knee angles in real-time (with options to select either the left or right leg).
- 〽️ **Angle Smoothing Algorithm**: Utilizes a median buffer calculation to ignore outliers and present a stable angle measurement across consecutive frames.
- 🌐 **Web Interface (Flask)**: A modern, interactive web dashboard available under `flask_app/` that supports starting/stopping live webcam tracking, switching legs, uploading static images for analysis, and exporting tracking data.
- 📊 **Data Export**: Ability to download the current angle measurements as a CSV file to monitor and review progress over time.

## 📁 Project Structure

```text
Orthopedics/
├── main.py                   # Main script for testing live tracking & stabilizing via local webcam
├── yolov8_pose_scan.py       # Basic script for validating YOLOv8 inference and skeleton mapping
├── flask_app/                # The complete Flask-based web application
│   ├── app.py                # Backend server, API routes, and logic 
│   ├── templates/            # HTML templates for the UI
│   ├── static/               # CSS, JavaScript, and Image Uploads directory
│   ├── requirements.txt      # Web app dependencies
│   └── README.md             # Detailed documentation specifically for the Flask app
├── Trained_Models/           # Directory for any custom-trained pose models
├── runs/                     # YOLOv8 execution and training outputs
├── yolov8n-pose.pt           # The pre-trained YOLOv8 pose model used by default
└── test.py                   # Testing and utility script
```

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- A working webcam for real-time tracking capabilities

### 1. Web Application Mode (Recommended)
To run the full-fledged application with a user interface:

1. Navigate to the `flask_app` directory:
   ```bash
   cd flask_app
   ```
2. Install the necessary dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
4. Access the application in your browser at `http://localhost:5000`.

### 2. Local Python Script Mode
For a quick local test without the web UI:

1. Open your terminal in the root `Orthopedics` directory.
2. Ensure you have the core dependencies installed (`pip install ultralytics opencv-python numpy`).
3. Run the main tracking script:
   ```bash
   python main.py
   ```
4. Follow the CLI prompt to select the leg (`L` or `R`). Press `q` while focused on the video window to quit.

## 🛠 Technology Stack
- **Computer Vision & AI**: Ultralytics YOLOv8 (Pose Estimation), OpenCV
- **Backend Server API**: Flask, Python
- **Frontend UI**: HTML, CSS, JavaScript (Bootstrap style)
- **Mathematical Processing**: NumPy (Vector calculations context for joint angle identification)

## 🤝 Contribution
Contributions are welcome. Feel free to open a PR or an issue to help improve tracking stability, support additional models, or add angle tracking features for other joints!

## 📜 License
This project is open-source and available under the MIT License.
