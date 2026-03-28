import cv2
import numpy as np
from collections import deque
from ultralytics import YOLO

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


# -----------------------------
# Main Script
# -----------------------------
def main():
    # Ask user for leg choice
    choice = input("👉 Choose leg to track (L for left / R for right): ").strip().lower()
    if choice == "l":
        leg_indices = [11, 13, 15]  # left leg
        print("✅ Tracking LEFT leg")
    elif choice == "r":
        leg_indices = [12, 14, 16]  # right leg
        print("✅ Tracking RIGHT leg")
    else:
        print("❌ Invalid choice, defaulting to LEFT leg")
        leg_indices = [11, 13, 15]

    # Load YOLOv8 pose model
    model = YOLO("yolov8n-pose.pt")

    # Open webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Could not open webcam")
        return

    print("🎥 Press 'q' to quit")

    # Buffer + smoothing parameters
    ANGLE_BUFFER_SIZE = 30  # ~2 sec at 15fps
    ANGLE_THRESHOLD = 3.0   # min change to update stable angle
    angle_buffer = deque(maxlen=ANGLE_BUFFER_SIZE)
    prev_stable_angle = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

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

            # -----------------------------
            # LEG BASED ON USER CHOICE
            # -----------------------------
            raw_angle = draw_leg_angle(frame, keypoints, leg_indices, stable_angle=prev_stable_angle)

            if raw_angle is not None:
                angle_buffer.append(raw_angle)

            # Compute stable angle from buffer
            if len(angle_buffer) > 5:
                median_angle = float(np.median(angle_buffer))

                if (prev_stable_angle is None or
                        abs(median_angle - prev_stable_angle) > ANGLE_THRESHOLD):
                    prev_stable_angle = median_angle

        cv2.imshow("Pose Tracking", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
