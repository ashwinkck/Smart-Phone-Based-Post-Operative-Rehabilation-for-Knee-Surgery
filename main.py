import cv2
import numpy as np
from collections import deque
from ultralytics import YOLO


# --------------------------------------------------
# ANGLE CALCULATION
# --------------------------------------------------
def calculate_internal_angle(a, b, c):
    """
    Calculates the internal angle ABC.
    Returns 180° for a straight line.
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cosine = np.dot(ba, bc) / (
        np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6
    )

    cosine = np.clip(cosine, -1.0, 1.0)

    angle = np.degrees(np.arccos(cosine))

    return angle


def calculate_clinical_knee_angle(hip, knee, ankle):
    """
    Clinical knee flexion convention:

    Straight leg  -> 0°
    90° bend      -> 90°
    Full flexion  -> ~140°

    Formula:
        clinical_angle = 180 - internal_angle
    """

    internal_angle = calculate_internal_angle(
        hip,
        knee,
        ankle
    )

    clinical_angle = 180 - internal_angle

    # Prevent tiny numerical negatives
    clinical_angle = max(0, clinical_angle)

    return clinical_angle


# --------------------------------------------------
# DRAWING
# --------------------------------------------------
def draw_leg_angle(frame, keypoints, indices, stable_angle=None):

    hip_idx, knee_idx, ankle_idx = indices

    pts = keypoints[[hip_idx, knee_idx, ankle_idx]]

    if np.any(pts < 0):
        return None

    hip = pts[0]
    knee = pts[1]
    ankle = pts[2]

    angle = calculate_clinical_knee_angle(
        hip,
        knee,
        ankle
    )

    # Skeleton
    cv2.line(
        frame,
        tuple(hip.astype(int)),
        tuple(knee.astype(int)),
        (255, 255, 255),
        3
    )

    cv2.line(
        frame,
        tuple(knee.astype(int)),
        tuple(ankle.astype(int)),
        (255, 255, 255),
        3
    )

    # Joints
    for p in pts:
        cv2.circle(
            frame,
            tuple(p.astype(int)),
            7,
            (0, 0, 255),
            -1
        )

    knee_pos = tuple(knee.astype(int) - np.array([20, 20]))

    cv2.putText(
        frame,
        f"Angle: {int(angle)} deg",
        knee_pos,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 255),
        2
    )

    if stable_angle is not None:

        cv2.putText(
            frame,
            f"Stable: {int(stable_angle)} deg",
            (knee_pos[0], knee_pos[1] - 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

    return angle


# --------------------------------------------------
# MAIN
# --------------------------------------------------
def main():

    choice = input(
        "Choose leg (L = Left, R = Right): "
    ).strip().lower()

    if choice == "r":
        leg_indices = [12, 14, 16]
        print("Tracking RIGHT leg")
    else:
        leg_indices = [11, 13, 15]
        print("Tracking LEFT leg")

    model = YOLO("yolov8n-pose.pt")

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Could not open webcam")
        return

    print("Press Q to quit")

    # Smoothing
    ANGLE_BUFFER_SIZE = 20
    ANGLE_THRESHOLD = 2

    angle_buffer = deque(maxlen=ANGLE_BUFFER_SIZE)

    stable_angle = None

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        results = model(frame, verbose=False)

        for result in results:

            if result.keypoints is None:
                continue

            kps = result.keypoints.xy.cpu().numpy()

            if len(kps) == 0:
                continue

            keypoints = kps[0]

            if keypoints.shape[0] < 17:
                continue

            angle = draw_leg_angle(
                frame,
                keypoints,
                leg_indices,
                stable_angle
            )

            if angle is not None:
                angle_buffer.append(angle)

            if len(angle_buffer) > 5:

                median_angle = float(
                    np.median(angle_buffer)
                )

                if (
                    stable_angle is None
                    or abs(median_angle - stable_angle)
                    > ANGLE_THRESHOLD
                ):
                    stable_angle = median_angle

        cv2.imshow(
            "Clinical Knee Angle Tracker",
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()