from ultralytics import YOLO

# Load YOLOv8 Pose model
model = YOLO("models/yolov8n-pose.pt")

# Run a test inference
model.predict("https://ultralytics.com/images/bus.jpg", save=True)

print("YOLO Pose is ready to use!")
