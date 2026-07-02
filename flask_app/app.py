import os
import cv2
import numpy as np
import base64
from collections import deque
from flask import Flask, render_template, request, jsonify, Response
from ultralytics import YOLO
import threading
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global variables for pose tracking
model = None
angle_buffer = deque(maxlen=30)
prev_stable_angle = None
current_leg_indices = [11, 13, 15]  # Default to left leg
is_tracking = False
latest_frame = None
latest_angle = None

# -----------------------------
# Utility functions
# -----------------------------
def calculate_angle(a, b, c):
    """Calculate the angle (in degrees) at point b given three points a, b, c."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ab = a - b
    cb = c - b

    cosine_angle = np.dot(ab, cb) / (np.linalg.norm(ab) * np.linalg.norm(cb) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def draw_leg_angle(frame, keypoints, indices, stable_angle=None):
    """Draw the leg angle for the given indices (hip, knee, ankle)."""
    h, k, a = indices  # hip, knee, ankle
    pts = keypoints[[h, k, a]]

    if np.any(pts < 0):  # invalid points
        return None

    # Calculate knee angle
    angle = calculate_angle(pts[0], pts[1], pts[2])

    # Draw skeleton lines
    cv2.line(frame, tuple(pts[0].astype(int)), tuple(pts[1].astype(int)), (255, 255, 255), 2)
    cv2.line(frame, tuple(pts[1].astype(int)), tuple(pts[2].astype(int)), (255, 255, 255), 2)

    # Draw points
    for p in pts:
        cv2.circle(frame, tuple(p.astype(int)), 6, (0, 0, 255), -1)

    # Display raw + stable angle near the knee
    knee_pos = tuple(pts[1].astype(int) - np.array([20, 20]))
    cv2.putText(frame, f"Raw: {int(angle)}°", knee_pos,
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    if stable_angle is not None:
        cv2.putText(frame, f"Stable: {int(stable_angle)}°",
                    (knee_pos[0], knee_pos[1] - 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

    return angle

def process_frame(frame):
    """Process a single frame for pose estimation."""
    global angle_buffer, prev_stable_angle, latest_angle
    
    if model is None:
        return frame
    
    # Run YOLOv8 pose estimation
    results = model(frame, verbose=False)
    
    for result in results:
        if result.keypoints is None:
            continue

        keypoints_array = result.keypoints.xy.cpu().numpy()
        if keypoints_array.shape[0] == 0:
            continue  # no person detected

        # take the first detected person only
        keypoints = keypoints_array[0]

        if keypoints.shape[0] < 17:
            continue  # incomplete skeleton

        # Draw leg angle based on current selection
        raw_angle = draw_leg_angle(frame, keypoints, current_leg_indices, stable_angle=prev_stable_angle)

        if raw_angle is not None:
            angle_buffer.append(raw_angle)
            latest_angle = raw_angle

        # Compute stable angle from buffer
        if len(angle_buffer) > 5:
            median_angle = float(np.median(angle_buffer))
            ANGLE_THRESHOLD = 3.0

            if (prev_stable_angle is None or
                    abs(median_angle - prev_stable_angle) > ANGLE_THRESHOLD):
                prev_stable_angle = median_angle
    
    return frame

def generate_frames():
    """Generate video frames for streaming."""
    global is_tracking, latest_frame
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if is_tracking:
            # Process frame with YOLO model
            processed_frame = process_frame(frame)
        else:
            # Just show the raw webcam frame
            processed_frame = frame
            
        latest_frame = processed_frame
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if ret:
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    cap.release()

# -----------------------------
# Routes
# -----------------------------
@app.route('/')
def index():
    """Main page."""
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    """Video streaming route."""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_tracking', methods=['POST'])
def start_tracking():
    """Start pose tracking."""
    global is_tracking, model, angle_buffer, prev_stable_angle
    
    if model is None:
        try:
            model = YOLO("yolov8n-pose.pt")
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    is_tracking = True
    angle_buffer.clear()
    prev_stable_angle = None
    
    return jsonify({'success': True, 'message': 'Tracking started'})

@app.route('/stop_tracking', methods=['POST'])
def stop_tracking():
    """Stop pose tracking."""
    global is_tracking
    is_tracking = False
    return jsonify({'success': True, 'message': 'Tracking stopped'})

@app.route('/set_leg', methods=['POST'])
def set_leg():
    """Set which leg to track."""
    global current_leg_indices
    
    data = request.get_json()
    leg_choice = data.get('leg', 'left').lower()
    
    if leg_choice == 'left':
        current_leg_indices = [11, 13, 15]  # left leg
    elif leg_choice == 'right':
        current_leg_indices = [12, 14, 16]  # right leg
    else:
        return jsonify({'success': False, 'error': 'Invalid leg choice'})
    
    return jsonify({'success': True, 'leg': leg_choice})

@app.route('/get_angle', methods=['GET'])
def get_angle():
    """Get current angle data."""
    global latest_angle, prev_stable_angle, angle_buffer
    
    return jsonify({
        'raw_angle': float(latest_angle) if latest_angle is not None else None,
        'stable_angle': float(prev_stable_angle) if prev_stable_angle is not None else None,
        'buffer_size': len(angle_buffer),
        'leg': 'left' if current_leg_indices == [11, 13, 15] else 'right'
    })

@app.route('/upload_image', methods=['POST'])
def upload_image():
    """Process uploaded image for pose estimation."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'})
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the image
        try:
            if model is None:
                model = YOLO("yolov8n-pose.pt")
            
            # Read and process image
            image = cv2.imread(filepath)
            processed_image = process_frame(image)
            
            # Save processed image
            processed_filename = f"processed_{filename}"
            processed_filepath = os.path.join(app.config['UPLOAD_FOLDER'], processed_filename)
            cv2.imwrite(processed_filepath, processed_image)
            
            # Encode processed image to base64 for display
            _, buffer = cv2.imencode('.jpg', processed_image)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return jsonify({
                'success': True,
                'processed_image': img_base64,
                'angle': latest_angle,
                'stable_angle': prev_stable_angle
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    return jsonify({'success': False, 'error': 'File processing failed'})

@app.route('/export_data', methods=['GET'])
def export_data():
    """Export angle data to CSV."""
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Raw Angle', 'Stable Angle', 'Timestamp'])
    
    # Add current data
    if latest_angle is not None:
        writer.writerow([latest_angle, prev_stable_angle, time.time()])
    
    output.seek(0)
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=pose_data.csv'}
    )

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
