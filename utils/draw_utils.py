import cv2
import numpy as np
import csv
import os

def calculate_angle(a, b, c):
    """
    Calculate the angle between three points (a, b, c).
    'b' is the joint (e.g., knee), 'a' and 'c' are the connected points.
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    # Compute vectors
    ba = a - b
    bc = c - b

    # Compute cosine of the angle using dot product
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    
    # Convert to degrees
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    
    return angle

def draw_keypoints(image, keypoints):
    """ Draws keypoints on the given frame """
    for kp in keypoints:
        for x, y in kp:
            cv2.circle(image, (int(x), int(y)), 5, (0, 0, 255), -1)  # Red keypoints

def draw_skeleton(image, keypoints):
    """ Draws skeleton connections between keypoints """
    SKELETON_CONNECTIONS = [
        (5, 7), (7, 9),  # Left arm
        (6, 8), (8, 10),  # Right arm
        (11, 13), (13, 15),  # Left leg
        (12, 14), (14, 16),  # Right leg
        (5, 6), (11, 12),  # Shoulders & hips
        (5, 11), (6, 12),  # Torso
        (0, 1), (1, 2), (2, 3), (3, 4)  # Head and neck
    ]
    
    for kp in keypoints:
        for pair in SKELETON_CONNECTIONS:
            pt1, pt2 = pair
            if pt1 < len(kp) and pt2 < len(kp):  # Ensure index is valid
                x1, y1 = int(kp[pt1][0]), int(kp[pt1][1])
                x2, y2 = int(kp[pt2][0]), int(kp[pt2][1])
                
                # Draw lines connecting joints
                cv2.line(image, (x1, y1), (x2, y2), (0, 255, 0), 3)  # Green lines
                
                # Draw keypoints as circles
                cv2.circle(image, (x1, y1), 5, (0, 0, 255), -1)
                cv2.circle(image, (x2, y2), 5, (0, 0, 255), -1)

def draw_angle(image, keypoints, joint_indices):
    """ Draws inner angles for the knee and returns the calculated value """
    try:
        a = keypoints[0][joint_indices[0]]  # Thigh
        b = keypoints[0][joint_indices[1]]  # Knee
        c = keypoints[0][joint_indices[2]]  # Shin
        
        inner_angle = calculate_angle(a, b, c)
        return inner_angle
    except IndexError:
        return None

def save_angles_to_csv(angles, filename="angles.csv"):
    """ Saves angles to CSV row-wise """
    if not angles:
        return
    file_exists = os.path.isfile(filename)
    
    with open(filename, mode="a", newline="") as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(["Left Knee Angle", "Right Knee Angle"])
        writer.writerow(angles[0])  # Save row-wise
    print("✅ Angles saved to CSV!")

def draw_bounding_box(image, keypoints):
    """ Draws a bounding box around the detected person in red """
    try:
        if len(keypoints) == 0:
            return  # Skip if no keypoints detected
        keypoints_array = np.array(keypoints[0])
        if keypoints_array.size == 0:
            return  # Skip if keypoints array is empty
        
        x_min, y_min = np.min(keypoints_array, axis=0)  # Get min (x, y)
        x_max, y_max = np.max(keypoints_array, axis=0)  # Get max (x, y)

        # Draw rectangle around detected person in red
        cv2.rectangle(image, (int(x_min), int(y_min)), (int(x_max), int(y_max)), (0, 0, 255), 2)
    except IndexError:
        pass
