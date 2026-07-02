// Configuration
const MODEL_URL = './yolov8n-pose.onnx';
const INPUT_SHAPE = [1, 3, 640, 640];
const CONFIDENCE_THRESHOLD = 0.25;

// DOM Elements
const video = document.getElementById('video-feed');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const rawAngleDisplay = document.getElementById('raw-angle');
const stableAngleDisplay = document.getElementById('stable-angle');
const statusAlert = document.getElementById('status-alert');

// State
let session = null;
let isTracking = false;
let animationId = null;
let angleBuffer = [];
let prevStableAngle = null;
let currentLegIndices = [11, 13, 15]; // Default Left Leg
let useFrontCamera = false;
let latestKeypoints = null; // Store latest AI results
let smoothedKeypoints = null; // Store interpolated positions for smoothness
let isInferencing = false;  // Prevent overlapping AI runs
const ANGLE_BUFFER_SIZE = 15; // Shorter buffer for mobile responsiveness
const ANGLE_THRESHOLD = 3.0;

// Initialize
async function init() {
    statusAlert.style.display = 'block';
    statusAlert.textContent = 'Loading AI Model (this may take a moment)...';
    
    try {
        // Load the ONNX model using WASM (most stable across all Android devices)
        session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] });
        statusAlert.style.display = 'none';
        startBtn.disabled = false;
        
        // Start camera preview immediately
        await startCamera();
        requestAnimationFrame(renderLoop);
    } catch (e) {
        console.error(e);
        statusAlert.className = 'alert alert-danger';
        statusAlert.textContent = 'Failed to load model: ' + e.message;
    }
}

async function startCamera() {
    try {
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: useFrontCamera ? 'user' : 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
        });
        video.srcObject = stream;
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    } catch (e) {
        console.error(e);
        alert('Could not access camera. Please check permissions.');
    }
}

// Event Listeners
startBtn.addEventListener('click', () => {
    isTracking = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    angleBuffer = [];
    prevStableAngle = null;
    latestKeypoints = null;
    smoothedKeypoints = null;
    // Kick off inference loop
    inferenceLoop();
});

stopBtn.addEventListener('click', () => {
    isTracking = false;
    latestKeypoints = null;
    smoothedKeypoints = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    rawAngleDisplay.textContent = '--°';
    stableAngleDisplay.textContent = '--°';
});

flipCameraBtn.addEventListener('click', async () => {
    useFrontCamera = !useFrontCamera;
    await startCamera();
});

document.querySelectorAll('input[name="leg-choice"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'left') {
            currentLegIndices = [11, 13, 15];
        } else {
            currentLegIndices = [12, 14, 16];
        }
    });
});

// Preprocessing
function preprocess(imageData) {
    const { data, width, height } = imageData;
    // We need [1, 3, 640, 640] Float32Array
    const float32Data = new Float32Array(3 * 640 * 640);
    
    // Scale image to 640x640 using basic nearest neighbor for speed
    const x_scale = width / 640;
    const y_scale = height / 640;
    
    for (let c = 0; c < 3; c++) {
        for (let y = 0; y < 640; y++) {
            for (let x = 0; x < 640; x++) {
                const orig_x = Math.floor(x * x_scale);
                const orig_y = Math.floor(y * y_scale);
                const i = (orig_y * width + orig_x) * 4;
                // Normalize 0-1
                float32Data[c * 640 * 640 + y * 640 + x] = data[i + c] / 255.0;
            }
        }
    }
    return new ort.Tensor('float32', float32Data, INPUT_SHAPE);
}

// Math Utility
function calculateAngle(a, b, c) {
    const ab = [a[0] - b[0], a[1] - b[1]];
    const cb = [c[0] - b[0], c[1] - b[1]];
    
    const dotProduct = ab[0]*cb[0] + ab[1]*cb[1];
    const normAB = Math.sqrt(ab[0]*ab[0] + ab[1]*ab[1]);
    const normCB = Math.sqrt(cb[0]*cb[0] + cb[1]*cb[1]);
    
    let cosineAngle = dotProduct / (normAB * normCB + 1e-6);
    cosineAngle = Math.max(-1.0, Math.min(1.0, cosineAngle));
    return Math.acos(cosineAngle) * (180.0 / Math.PI);
}

// Separate Inference Loop (Runs asynchronously so it doesn't block camera)
async function inferenceLoop() {
    if (!isTracking || !session || isInferencing) return;
    
    isInferencing = true;
    try {
        // 1. Grab current frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const tensor = preprocess(imgData);
        
        // 2. Run Inference
        const results = await session.run({ images: tensor });
        const output = results[Object.keys(results)[0]].data; // shape [1, 56, 8400]
        
        // 3. Find the best person
        let maxScore = 0;
        let bestIdx = -1;
        for (let i = 0; i < 8400; i++) {
            const score = output[4 * 8400 + i];
            if (score > maxScore) {
                maxScore = score;
                bestIdx = i;
            }
        }
        
        if (maxScore > CONFIDENCE_THRESHOLD) {
            const keypoints = [];
            for (let k = 0; k < 17; k++) {
                const x = output[(5 + k*3) * 8400 + bestIdx];
                const y = output[(5 + k*3 + 1) * 8400 + bestIdx];
                const vis = output[(5 + k*3 + 2) * 8400 + bestIdx];
                
                const mappedX = (x / 640) * tempCanvas.width;
                const mappedY = (y / 640) * tempCanvas.height;
                keypoints.push([mappedX, mappedY, vis]);
            }
            latestKeypoints = keypoints;
        }
        // If we want it to blink out when losing tracking, uncomment this:
        // else { latestKeypoints = null; } 
        // Keeping it commented means it will "hold" the last known pose if it briefly loses tracking
        
    } catch (e) {
        console.error("Inference Error:", e);
    }
    
    isInferencing = false;
    if (isTracking) {
        // Cap AI at ~24 FPS (41ms) to prevent mobile overheating while maintaining smooth UI
        setTimeout(inferenceLoop, 41);
    }
}

// Main Render Loop (Runs at 60 FPS purely for drawing)
function renderLoop() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // 1. Draw raw video to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 2. Draw latest known AI skeleton on top with Lerping
        if (isTracking && latestKeypoints) {
            
            // Apply Lerping (Linear Interpolation) for buttery smooth nodes
            if (!smoothedKeypoints) {
                // Initialize if first time
                smoothedKeypoints = latestKeypoints.map(kp => [...kp]);
            } else {
                const LERP_FACTOR = 0.25; // 0.25 gives a nice smooth slide without too much lag
                for (let k = 0; k < 17; k++) {
                    smoothedKeypoints[k][0] += (latestKeypoints[k][0] - smoothedKeypoints[k][0]) * LERP_FACTOR;
                    smoothedKeypoints[k][1] += (latestKeypoints[k][1] - smoothedKeypoints[k][1]) * LERP_FACTOR;
                    smoothedKeypoints[k][2] = latestKeypoints[k][2]; // visibility
                }
            }

            const h_idx = currentLegIndices[0];
            const k_idx = currentLegIndices[1];
            const a_idx = currentLegIndices[2];
            
            const p1 = smoothedKeypoints[h_idx];
            const p2 = smoothedKeypoints[k_idx];
            const p3 = smoothedKeypoints[a_idx];
            
            if (p1[2] > 0.5 && p2[2] > 0.5 && p3[2] > 0.5) {
                const angle = calculateAngle(p1, p2, p3);
                const roundedAngle = Math.round(angle);
                
                ctx.beginPath();
                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(p2[0], p2[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                [p1, p2, p3].forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p[0], p[1], 8, 0, 2 * Math.PI);
                    ctx.fillStyle = '#FF0000';
                    ctx.fill();
                });
                
                rawAngleDisplay.textContent = `${roundedAngle}°`;
                
                angleBuffer.push(angle);
                if (angleBuffer.length > ANGLE_BUFFER_SIZE) {
                    angleBuffer.shift();
                }
                
                if (angleBuffer.length >= 5) {
                    const sorted = [...angleBuffer].sort((a,b) => a-b);
                    const median = sorted[Math.floor(sorted.length/2)];
                    
                    if (prevStableAngle === null || Math.abs(median - prevStableAngle) > ANGLE_THRESHOLD) {
                        prevStableAngle = median;
                    }
                }
                
                if (prevStableAngle !== null) {
                    stableAngleDisplay.textContent = `${Math.round(prevStableAngle)}°`;
                    ctx.font = '20px Arial';
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillText(`Raw: ${roundedAngle}°`, p2[0] - 30, p2[1] - 20);
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillText(`Stable: ${Math.round(prevStableAngle)}°`, p2[0] - 30, p2[1] - 45);
                }
            }
        }
    }
    requestAnimationFrame(renderLoop);
}

// Start everything
init();
