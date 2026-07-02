import cv2
from ultralytics import YOLO

# ---------------- CONFIG ----------------
MODEL_PATH = r"/home/ash/Projects/Smart-Phone-Based-Post-Operative-Rehabilation-for-Knee-Surgery/yolov8n-pose.pt"  # <-- change this to your model's full path
CONFIDENCE_THRESHOLD = 0.5
# ----------------------------------------

# Load model
model = YOLO(MODEL_PATH)

# Open webcam (0 = default cam)
cap = cv2.VideoCapture(0)

# Skeleton pairs (COCO format used by YOLOv8)
SKELETON = [
    (15, 13), (13, 11), (16, 14), (14, 12),
    (11, 12), (5, 11), (6, 12), (5, 6),
    (5, 7), (7, 9), (6, 8), (8, 10),
    (1, 2), (0, 1), (0, 2), (1, 3), (2, 4)
]

# Main loop
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLOv8 pose inference
    results = model(frame, verbose=False)

    # Draw keypoints and skeletons
    for result in results:
        if result.keypoints is None:
            continue

        keypoints = result.keypoints.xy.cpu().numpy()  # (num_people, num_kpts, 2)
        for person_kps in keypoints:
            # Draw skeleton lines
            for a, b in SKELETON:
                if person_kps[a][0] > 0 and person_kps[b][0] > 0:
                    pt1 = tuple(map(int, person_kps[a]))
                    pt2 = tuple(map(int, person_kps[b]))
                    cv2.line(frame, pt1, pt2, (0, 255, 0), 3)

            # Draw keypoint nodes
            for x, y in person_kps:
                if x > 0 and y > 0:
                    cv2.circle(frame, (int(x), int(y)), 4, (0, 0, 255), -1)

    cv2.imshow("YOLO Pose Estimation", frame)
    if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit
        break

cap.release()
cv2.destroyAllWindows()
