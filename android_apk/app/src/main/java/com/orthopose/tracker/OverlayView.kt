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

    private val shadowLinePaint = Paint().apply {
        color = Color.BLACK
        strokeWidth = 24f // Thicker than 16f
        style = Paint.Style.STROKE
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
    }

    private val linePaint = Paint().apply {
        color = Color.parseColor("#00FFAA") // Bright Neon Green
        strokeWidth = 12f
        style = Paint.Style.STROKE
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
    }

    private val shadowPointPaint = Paint().apply {
        color = Color.BLACK
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val pointPaint = Paint().apply {
        color = Color.parseColor("#FF0055") // Bright Neon Pink/Red
        style = Paint.Style.FILL
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
        
        val internalAngle = (acos(cosineAngle) * (180.0 / Math.PI)).toFloat()
        val clinicalAngle = 180f - internalAngle
        
        return max(0f, clinicalAngle)
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

        // Always draw if points exist, ignore visibility score which might be flaky
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

        // Draw shadow lines first
        canvas.drawLine(x1, y1, x2, y2, shadowLinePaint)
        canvas.drawLine(x2, y2, x3, y3, shadowLinePaint)

        // Draw actual lines
        canvas.drawLine(x1, y1, x2, y2, linePaint)
        canvas.drawLine(x2, y2, x3, y3, linePaint)
        
        // Draw shadow points
        canvas.drawCircle(x1, y1, 35f, shadowPointPaint)
        canvas.drawCircle(x2, y2, 35f, shadowPointPaint)
        canvas.drawCircle(x3, y3, 35f, shadowPointPaint)

        // Draw actual points
        canvas.drawCircle(x1, y1, 25f, pointPaint)
        canvas.drawCircle(x2, y2, 25f, pointPaint)
        canvas.drawCircle(x3, y3, 25f, pointPaint)
    }
}
