package com.orthopose.tracker

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.ImageProxy
import org.tensorflow.lite.DataType
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import java.nio.ByteBuffer
import java.nio.ByteOrder

class PoseEstimator(context: Context) {

    private var interpreter: Interpreter
    private val modelPath = "yolov8n-pose.tflite" // The FP32 model we exported
    private val inputSize = 320
    private val outputSize = 56 * 2100 // 1x56x2100 for 320 imgsz
    
    init {
        val compatList = CompatibilityList()
        val options = Interpreter.Options()

        if(compatList.isDelegateSupportedOnThisDevice) {
            // Enable hardware acceleration via GPU Delegate
            val delegateOptions = compatList.bestOptionsForThisDevice
            // Force FP16 precision at runtime for the FP32 model for 2x faster performance
            delegateOptions.setQuantizedModelsAllowed(false)
            options.addDelegate(GpuDelegate(delegateOptions))
            options.setAllowFp16PrecisionForFp32(true) 
        } else {
            // Fallback to CPU but use 4 threads
            options.setNumThreads(4)
        }

        val model = FileUtil.loadMappedFile(context, modelPath)
        interpreter = Interpreter(model, options)
    }

    fun estimate(imageProxy: ImageProxy): List<FloatArray>? {
        val bitmap = imageProxy.toBitmap()
        val matrix = Matrix()
        matrix.postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
        val rotatedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)

        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(inputSize, inputSize, ResizeOp.ResizeMethod.NEAREST_NEIGHBOR))
            .build()
            
        var tensorImage = TensorImage(DataType.FLOAT32)
        tensorImage.load(rotatedBitmap)
        tensorImage = imageProcessor.process(tensorImage)
        
        // YOLOv8 requires normalized inputs (0.0 to 1.0)
        val normalizedBuffer = ByteBuffer.allocateDirect(4 * 3 * inputSize * inputSize)
        normalizedBuffer.order(ByteOrder.nativeOrder())
        val intValues = IntArray(inputSize * inputSize)
        tensorImage.bitmap.getPixels(intValues, 0, inputSize, 0, 0, inputSize, inputSize)
        
        for (i in 0 until inputSize) {
            for (j in 0 until inputSize) {
                val pixelValue = intValues[i * inputSize + j]
                normalizedBuffer.putFloat(((pixelValue shr 16) and 0xFF) / 255.0f) // R
                normalizedBuffer.putFloat(((pixelValue shr 8) and 0xFF) / 255.0f)  // G
                normalizedBuffer.putFloat((pixelValue and 0xFF) / 255.0f)         // B
            }
        }

        val outputBuffer = TensorBuffer.createFixedSize(intArrayOf(1, 56, 2100), DataType.FLOAT32)
        
        // Run Inference
        interpreter.run(normalizedBuffer, outputBuffer.buffer)
        
        return parseOutput(outputBuffer.floatArray)
    }

    private fun parseOutput(output: FloatArray): List<FloatArray>? {
        var maxScore = 0f
        var bestIdx = -1

        // Find highest confidence person
        for (i in 0 until 2100) {
            val score = output[4 * 2100 + i]
            if (score > maxScore) {
                maxScore = score
                bestIdx = i
            }
        }

        if (maxScore > 0.25f) {
            val keypoints = mutableListOf<FloatArray>()
            for (k in 0 until 17) {
                val x = output[(5 + k * 3) * 2100 + bestIdx]
                val y = output[(5 + k * 3 + 1) * 2100 + bestIdx]
                val vis = output[(5 + k * 3 + 2) * 2100 + bestIdx]
                keypoints.add(floatArrayOf(x / inputSize, y / inputSize, vis))
            }
            return keypoints
        }
        return null
    }
    
    fun close() {
        interpreter.close()
    }
}
