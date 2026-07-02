# Kineo - Next-Generation Clinical Knee Tracking 🦴📸

Real-time AI pose estimation that transforms your Android smartphone into a clinical-grade goniometer. Track post-operative knee flexion accurately and effortlessly.

Kineo eliminates the need for expensive wearables and manual measurements by running a highly optimized **YOLOv8** pose estimation model directly on your smartphone's GPU. All measurements are automatically synced to a secure, cloud-based **Doctor Portal**, allowing orthopedic surgeons to monitor daily rehabilitation progress remotely.

## 🌟 Key Features

- 🎥 **Zero Latency AI**: High-performance human pose detection utilizing an optimized YOLOv8 ONNX model running entirely on-device (no cloud processing delays).
- 📐 **Clinical Flexion Protocol**: Accurately calculates internal and clinical knee angles. Instantly differentiates between a straight leg (0°) and full flexion with advanced stabilization algorithms.
- ☁️ **Physician Syncing**: Real-time Firebase Firestore integration instantly pushes recorded max-flexion sessions to the cloud the moment a session ends.
- 🌐 **Interactive Doctor Dashboard**: A sleek, dark-mode Next.js web application providing doctors with patient analytics, total session tracking, and interactive progression charts.

## 📁 Project Structure

```text
Kineo/
├── android_apk/              # The Native Android Application
│   ├── app/src/main/java/    # Kotlin source code (Camera, ONNX Inference, Firebase)
│   ├── app/src/main/res/     # Android UI Layouts and Resources
│   └── app/google-services.json # Firebase Configuration
├── web-page/                 # The Next.js Doctor Portal
│   ├── src/app/              # Next.js Pages and Global Styles
│   ├── public/               # Static assets (Logos, APK downloads)
│   └── package.json          # Web app dependencies
├── main.py                   # Python script for initial local YOLOv8 testing
└── yolov8_pose_scan.py       # Basic script for validating YOLOv8 inference
```

## 🚀 Getting Started

### 1. Doctor Portal (Web App)
The Doctor Portal is built with React and Next.js.

1. Navigate to the `web-page` directory:
   ```bash
   cd web-page
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard in your browser at `http://localhost:3000`.

### 2. Android Tracking Application
To build the tracking app onto your smartphone:

1. Open the `android_apk` folder using **Android Studio**.
2. Connect your Android device via USB or start an emulator.
3. Ensure you have the `google-services.json` file placed in the `android_apk/app/` directory and that your Firebase project is configured with a Firestore database in Test Mode.
4. Click the green **Run (Play)** button in Android Studio to compile and install the application.

## 🛠 Technology Stack
- **Mobile AI Engine**: ONNX Runtime Mobile, Ultralytics YOLOv8 (Pose Estimation)
- **Android App**: Kotlin, CameraX, Android Canvas Graphics
- **Backend & Database**: Google Firebase (Firestore)
- **Web Dashboard**: Next.js, React, CSS3 (Glassmorphism & Neon Design)

## 🤝 Contribution
Contributions are welcome. Feel free to open a PR or an issue to help improve tracking stability, support additional models, or add angle tracking features for other joints!

## 📜 License
This project is open-source and available under the MIT License.
