// Main JavaScript functionality for Pose Tracking App

// Global variables
let isTracking = false;
let angleUpdateInterval;
let statusTimeout;

// Utility functions
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
}

function formatAngle(angle) {
    if (angle === null || angle === undefined) {
        return '--°';
    }
    return Math.round(angle) + '°';
}

function updateAngleDisplay(rawAngle, stableAngle) {
    const rawDisplay = document.getElementById('raw-angle');
    const stableDisplay = document.getElementById('stable-angle');
    
    if (rawDisplay) {
        rawDisplay.textContent = formatAngle(rawAngle);
    }
    
    if (stableDisplay) {
        stableDisplay.textContent = formatAngle(stableAngle);
    }
}

function updateButtonStates(tracking) {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (startBtn && stopBtn) {
        startBtn.disabled = tracking;
        stopBtn.disabled = !tracking;
    }
}

// API functions
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

async function startTracking() {
    try {
        const data = await apiCall('/start_tracking', { method: 'POST' });
        
        if (data.success) {
            isTracking = true;
            updateButtonStates(true);
            showNotification('Tracking started successfully!', 'success');
            startAngleUpdates();
        } else {
            showNotification('Error: ' + data.error, 'danger');
        }
    } catch (error) {
        showNotification('Error starting tracking: ' + error.message, 'danger');
    }
}

async function stopTracking() {
    try {
        const data = await apiCall('/stop_tracking', { method: 'POST' });
        
        if (data.success) {
            isTracking = false;
            updateButtonStates(false);
            showNotification('Tracking stopped.', 'info');
            stopAngleUpdates();
        } else {
            showNotification('Error: ' + data.error, 'danger');
        }
    } catch (error) {
        showNotification('Error stopping tracking: ' + error.message, 'danger');
    }
}

async function changeLeg(leg) {
    try {
        const data = await apiCall('/set_leg', {
            method: 'POST',
            body: JSON.stringify({ leg: leg })
        });
        
        if (data.success) {
            showNotification(`Switched to ${leg} leg tracking.`, 'success');
        } else {
            showNotification('Error: ' + data.error, 'danger');
        }
    } catch (error) {
        showNotification('Error changing leg: ' + error.message, 'danger');
    }
}

async function getAngleData() {
    try {
        const data = await apiCall('/get_angle');
        updateAngleDisplay(data.raw_angle, data.stable_angle);
        return data;
    } catch (error) {
        console.error('Error fetching angle data:', error);
    }
}

function startAngleUpdates() {
    if (angleUpdateInterval) {
        clearInterval(angleUpdateInterval);
    }
    
    angleUpdateInterval = setInterval(getAngleData, 100); // Update every 100ms
}

function stopAngleUpdates() {
    if (angleUpdateInterval) {
        clearInterval(angleUpdateInterval);
        angleUpdateInterval = null;
    }
}

function exportData() {
    window.open('/export_data', '_blank');
    showNotification('Data export started!', 'info');
}

async function handleImageUpload(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('image-file');
    
    if (!fileInput.files.length) {
        showNotification('Please select an image file.', 'warning');
        return;
    }
    
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch('/upload_image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const processedImage = document.getElementById('processed-image');
            const uploadResult = document.getElementById('upload-result');
            const uploadAngle = document.getElementById('upload-angle');
            const uploadStable = document.getElementById('upload-stable');
            
            if (processedImage) {
                processedImage.src = 'data:image/jpeg;base64,' + data.processed_image;
            }
            
            if (uploadAngle) {
                uploadAngle.textContent = formatAngle(data.angle);
            }
            
            if (uploadStable) {
                uploadStable.textContent = formatAngle(data.stable_angle);
            }
            
            if (uploadResult) {
                uploadResult.style.display = 'block';
            }
            
            showNotification('Image processed successfully!', 'success');
        } else {
            showNotification('Error: ' + data.error, 'danger');
        }
    } catch (error) {
        showNotification('Error processing image: ' + error.message, 'danger');
    }
}

// Event listeners setup
function setupEventListeners() {
    // Button event listeners
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const exportBtn = document.getElementById('export-btn');
    const uploadForm = document.getElementById('upload-form');
    
    if (startBtn) {
        startBtn.addEventListener('click', startTracking);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopTracking);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleImageUpload);
    }
    
    // Leg selection event listeners
    const legRadios = document.querySelectorAll('input[name="leg-choice"]');
    legRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            changeLeg(e.target.value);
        });
    });
    
    // Video feed error handling
    const videoFeed = document.getElementById('video-feed');
    if (videoFeed) {
        videoFeed.onerror = function() {
            showNotification('Camera not available. Please check your camera permissions.', 'warning', 5000);
        };
        
        videoFeed.onload = function() {
            console.log('Video feed loaded successfully');
        };
    }
}

// Initialize application
function initializeApp() {
    console.log('Initializing Pose Tracking App...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial state
    updateButtonStates(false);
    
    // Check for camera availability
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
                console.log('Camera access granted');
            })
            .catch((error) => {
                console.warn('Camera access denied:', error);
                showNotification('Camera access is required for live tracking. Please enable camera permissions.', 'warning', 8000);
            });
    } else {
        showNotification('Camera not supported in this browser.', 'warning', 5000);
    }
    
    console.log('App initialized successfully');
}

// Cleanup function
function cleanup() {
    stopAngleUpdates();
    if (statusTimeout) {
        clearTimeout(statusTimeout);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Cleanup when page is unloaded
window.addEventListener('beforeunload', cleanup);

// Export functions for global access if needed
window.PoseTrackingApp = {
    startTracking,
    stopTracking,
    changeLeg,
    exportData,
    showNotification,
    updateAngleDisplay
};
