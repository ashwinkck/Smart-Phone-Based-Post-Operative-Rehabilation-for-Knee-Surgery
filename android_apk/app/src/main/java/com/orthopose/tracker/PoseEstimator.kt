package com.orthopose.tracker

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.ImageProxy
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

class PoseEstimator(context: Context) {

    private var interpreter: Interpreter
    private val modelPath = "yolov8n-pose.tflite"
    private val inputSize = 320
    
    init {
        val compatList = CompatibilityList()
        val options = Interpreter.Options()

        if(compatList.isDelegateSupportedOnThisDevice) {
            val delegateOptions = compatList.bestOptionsForThisDevice
            delegateOptions.setQuantizedModelsAllowed(false)
            options.addDelegate(GpuDelegate(delegateOptions))
            options.setAllowFp16PrecisionForFp32(true) 
        } else {
            options.setNumThreads(4)
        }

        val assetFileDescriptor = context.assets.openFd(modelPath)
        val fileInputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = fileInputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        val model = fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)

        interpreter = Interpreter(model, options)
    }

    fun estimate(imageProxy: ImageProxy): List<FloatArray>? {
        val bitmap = imageProxy.toBitmap()
        val matrix = Matrix()
        matrix.postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
        val rotatedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)

        val scaledBitmap = Bitmap.createScaledBitmap(rotatedBitmap, inputSize, inputSize, false)
        
        val normalizedBuffer = ByteBuffer.allocateDirect(4 * 3 * inputSize * inputSize)
        normalizedBuffer.order(ByteOrder.nativeOrder())
        val intValues = IntArray(inputSize * inputSize)
        scaledBitmap.getPixels(intValues, 0, inputSize, 0, 0, inputSize, inputSize)
        
        // YOLO models expect NCHW format: all Reds, then all Greens, then all Blues
        val channelSize = inputSize * inputSize
        for (i in 0 until channelSize) {
            val pixelValue = intValues[i]
            val r = ((pixelValue shr 16) and 0xFF) / 255.0f
            val g = ((pixelValue shr 8) and 0xFF) / 255.0f
            val b = (pixelValue and 0xFF) / 255.0f
            
            // Put using absolute positioning so we don't need to manually advance position
            normalizedBuffer.putFloat(i * 4, r)
            normalizedBuffer.putFloat((channelSize + i) * 4, g)
            normalizedBuffer.putFloat((2 * channelSize + i) * 4, b)
        }
        // TFLite requires the buffer position to be at 0 or fully advanced if read sequentially.
        // Since we used absolute puts, the position is 0.
        normalizedBuffer.position(0)

        val outputArray = Array(1) { Array(56) { FloatArray(2100) } }
        
        interpreter.run(normalizedBuffer, outputArray)
        
        return parseOutput(outputArray[0])
    }

    private fun parseOutput(output: Array<FloatArray>): List<FloatArray>? {
        var maxScore = 0f
        var bestIdx = -1

        for (i in 0 until 2100) {
            val score = output[4][i]
            if (score > maxScore) {
                maxScore = score
                bestIdx = i
            }
        }

        if (maxScore > 0.25f) {
            val keypoints = mutableListOf<FloatArray>()
            for (k in 0 until 17) {
                var x = output[5 + k * 3][bestIdx]
                var y = output[5 + k * 3 + 1][bestIdx]
                val vis = output[5 + k * 3 + 2][bestIdx]
                
                // Ultralytics TFLite exports can sometimes output normalized coordinates (0..1) 
                // instead of pixel coordinates (0..320). We dynamically detect and fix this!
                if (x > 2.0f || y > 2.0f) {
                    x /= inputSize
                    y /= inputSize
                }
                
                keypoints.add(floatArrayOf(x, y, vis))
            }
            return keypoints
        }
        return null
    }
    
    fun close() {
        interpreter.close()
    }
}
