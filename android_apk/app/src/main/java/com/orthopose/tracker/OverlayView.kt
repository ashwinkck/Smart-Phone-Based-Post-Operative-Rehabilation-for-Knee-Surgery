package com.orthopose.tracker

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import java.util.LinkedList
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sqrt

class OverlayView(context: Context, attrs: AttributeSet?) : View(context, attrs) {

    private var latestKeypoints: List<FloatArray>? = null
    private var smoothedKeypoints: Array<FloatArray>? = null
    private var imgWidth = 0
    private var imgHeight = 0
    private var isFrontCam = false
    private var isLeftLeg = true
    
    private var rawAngle = 0
    private var stableAngle = 0
    
    private val angleBuffer = LinkedList<Float>()
    private var prevStableAngle: Float? = null
    private val ANGLE_BUFFER_SIZE = 15
    private val ANGLE_THRESHOLD = 3.0f

    private val linePaint = Paint().apply {
        color = Color.WHITE
        strokeWidth = 8f
        style = Paint.Style.STROKE
    }

    private val pointPaint = Paint().apply {
        color = Color.RED
        style = Paint.Style.FILL
    }

    private val textPaint = Paint().apply {
        color = Color.YELLOW
        textSize = 50f
        isAntiAlias = true
    }

    fun setKeypoints(keypoints: List<FloatArray>?, width: Int, height: Int, frontCam: Boolean) {
        latestKeypoints = keypoints
        imgWidth = width
        imgHeight = height
        isFrontCam = frontCam
        
        if (keypoints != null) {
            if (smoothedKeypoints == null) {
                smoothedKeypoints = Array(17) { i -> floatArrayOf(keypoints[i][0], keypoints[i][1], keypoints[i][2]) }
            } else {
                // Lerping
                val LERP_FACTOR = 0.25f
                for (i in 0 until 17) {
                    smoothedKeypoints!![i][0] += (keypoints[i][0] - smoothedKeypoints!![i][0]) * LERP_FACTOR
                    smoothedKeypoints!![i][1] += (keypoints[i][1] - smoothedKeypoints!![i][1]) * LERP_FACTOR
                    smoothedKeypoints!![i][2] = keypoints[i][2]
                }
            }
        }
        invalidate()
    }

    fun setTargetLeg(isLeft: Boolean) {
        isLeftLeg = isLeft
        resetSmoothing()
    }

    fun clear() {
        latestKeypoints = null
        resetSmoothing()
        invalidate()
    }

    fun resetSmoothing() {
        smoothedKeypoints = null
        angleBuffer.clear()
        prevStableAngle = null
    }

    fun getCalculatedAngles(): Pair<Int, Int>? {
        return if (latestKeypoints != null && prevStableAngle != null) Pair(rawAngle, stableAngle) else null
    }

    private fun calculateAngle(p1: FloatArray, p2: FloatArray, p3: FloatArray): Float {
        val a = sqrt((p2[0] - p1[0]).pow(2) + (p2[1] - p1[1]).pow(2))
        val b = sqrt((p2[0] - p3[0]).pow(2) + (p2[1] - p3[1]).pow(2))
        val c = sqrt((p3[0] - p1[0]).pow(2) + (p3[1] - p1[1]).pow(2))

        var cosineAngle = (a.pow(2) + b.pow(2) - c.pow(2)) / (2 * a * b)
        cosineAngle = max(-1.0f, min(1.0f, cosineAngle))
        return (acos(cosineAngle) * (180.0 / Math.PI)).toFloat()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        if (smoothedKeypoints == null || imgWidth == 0 || imgHeight == 0) return

        val scaleX = width.toFloat() / imgWidth.toFloat()
        val scaleY = height.toFloat() / imgHeight.toFloat()
        
        // Maintain aspect ratio, center crop
        val scale = max(scaleX, scaleY)
        val offsetX = (width - imgWidth * scale) / 2f
        val offsetY = (height - imgHeight * scale) / 2f

        val hIdx = if (isLeftLeg) 11 else 12
        val kIdx = if (isLeftLeg) 13 else 14
        val aIdx = if (isLeftLeg) 15 else 16

        val p1 = smoothedKeypoints!![hIdx]
        val p2 = smoothedKeypoints!![kIdx]
        val p3 = smoothedKeypoints!![aIdx]

        if (p1[2] > 0.5f && p2[2] > 0.5f && p3[2] > 0.5f) {
            val angle = calculateAngle(p1, p2, p3)
            rawAngle = Math.round(angle)

            angleBuffer.add(angle)
            if (angleBuffer.size > ANGLE_BUFFER_SIZE) angleBuffer.removeFirst()
            
            if (angleBuffer.size >= 5) {
                val sorted = angleBuffer.sorted()
                val median = sorted[sorted.size / 2]
                if (prevStableAngle == null || Math.abs(median - prevStableAngle!!) > ANGLE_THRESHOLD) {
                    prevStableAngle = median
                }
            }
            stableAngle = Math.round(prevStableAngle ?: angle)

            val mapX = { x: Float -> 
                val scaled = x * imgWidth * scale + offsetX
                if (isFrontCam) width - scaled else scaled 
            }
            val mapY = { y: Float -> y * imgHeight * scale + offsetY }

            val x1 = mapX(p1[0])
            val y1 = mapY(p1[1])
            val x2 = mapX(p2[0])
            val y2 = mapY(p2[1])
            val x3 = mapX(p3[0])
            val y3 = mapY(p3[1])

            canvas.drawLine(x1, y1, x2, y2, linePaint)
            canvas.drawLine(x2, y2, x3, y3, linePaint)
            
            canvas.drawCircle(x1, y1, 15f, pointPaint)
            canvas.drawCircle(x2, y2, 15f, pointPaint)
            canvas.drawCircle(x3, y3, 15f, pointPaint)

            canvas.drawText("Raw: $rawAngle°", x2 - 50f, y2 - 40f, textPaint)
            textPaint.color = Color.CYAN
            canvas.drawText("Stable: $stableAngle°", x2 - 50f, y2 - 100f, textPaint)
            textPaint.color = Color.YELLOW
        }
    }
}
