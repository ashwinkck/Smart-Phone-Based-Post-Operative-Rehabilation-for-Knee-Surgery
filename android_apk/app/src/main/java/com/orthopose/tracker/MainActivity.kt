package com.orthopose.tracker

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.orthopose.tracker.databinding.ActivityMainBinding
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var poseEstimator: PoseEstimator
    
    private var isTracking = false
    private var isFrontCamera = false
    private var isLeftLeg = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Pose Estimator
        poseEstimator = PoseEstimator(this)

        // Setup Buttons
        binding.btnStart.setOnClickListener {
            isTracking = true
            binding.btnStart.isEnabled = false
            binding.btnStop.isEnabled = true
            binding.overlay.resetSmoothing()
        }

        binding.btnStop.setOnClickListener {
            isTracking = false
            binding.btnStart.isEnabled = true
            binding.btnStop.isEnabled = false
            binding.overlay.clear()
            binding.tvRawAngle.text = "--°"
            binding.tvStableAngle.text = "--°"
        }

        binding.btnFlip.setOnClickListener {
            isFrontCamera = !isFrontCamera
            startCamera()
        }

        binding.rgLegSelection.setOnCheckedChangeListener { _, checkedId ->
            isLeftLeg = checkedId == R.id.rbLeftLeg
            binding.overlay.setTargetLeg(isLeftLeg)
        }

        cameraExecutor = Executors.newSingleThreadExecutor()

        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                }

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { image ->
                        if (isTracking) {
                            val keypoints = poseEstimator.estimate(image)
                            runOnUiThread {
                                binding.overlay.setKeypoints(keypoints, image.width, image.height, isFrontCamera)
                                val angles = binding.overlay.getCalculatedAngles()
                                if (angles != null) {
                                    binding.tvRawAngle.text = "${angles.first}°"
                                    binding.tvStableAngle.text = "${angles.second}°"
                                }
                            }
                        }
                        image.close()
                    }
                }

            val cameraSelector = if (isFrontCamera) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageAnalyzer
                )
            } catch (exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        poseEstimator.close()
    }

    companion object {
        private const val TAG = "OrthoPose"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }
}
