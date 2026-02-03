package splunkotelreactnative.example

import android.app.Activity
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import kotlin.random.Random

/**
 * Native module for testing SDK features from React Native.
 * Provides crash simulation, ANR triggering, slow rendering, and network testing.
 */
class SplunkTestModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SplunkTestModule"

    private val mainHandler = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()
    
    private val okHttpClient = OkHttpClient()

    companion object {
        private const val TAG = "SplunkTestModule"
        
        // Slow rendering constants
        private const val SLOW_RENDER_DELAY_MS = 30L
        private const val FROZEN_RENDER_DELAY_MS = 800L
        private const val DEFAULT_REFRESH_INTERVAL_MS = 16L
        private const val FROZEN_REFRESH_INTERVAL_MS = 1000L
        private const val DEFAULT_TEST_DURATION_MS = 10_000L
        private const val CIRCLES_PER_FRAME = 200
        private const val CIRCLE_RADIUS = 3f
        
        // ANR timeout
        private const val ANR_TIMEOUT_MS = 10_000L
    }

    @ReactMethod
    fun simulateCrash(promise: Promise) {
        mainHandler.post {
            throw RuntimeException("Test crash triggered from React Native (Android)")
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun simulateANR(promise: Promise) {
        Log.d(TAG, "Starting ANR simulation for ${ANR_TIMEOUT_MS}ms")
        // Block the main thread to trigger ANR detection
        mainHandler.post {
            Thread.sleep(ANR_TIMEOUT_MS)
            Log.d(TAG, "ANR simulation complete")
        }
        promise.resolve("ANR simulation started")
    }

    @ReactMethod
    fun simulateSlowRender(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity available")
            return
        }

        mainHandler.post {
            simulateSlowRendering(
                activity = activity,
                renderDelayMs = SLOW_RENDER_DELAY_MS,
                color = Color.BLUE,
                refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS
            )
        }
        promise.resolve("Slow render simulation started")
    }

    @ReactMethod
    fun simulateFrozenRender(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity available")
            return
        }

        mainHandler.post {
            simulateSlowRendering(
                activity = activity,
                renderDelayMs = FROZEN_RENDER_DELAY_MS,
                color = Color.RED,
                refreshIntervalMs = FROZEN_REFRESH_INTERVAL_MS
            )
        }
        promise.resolve("Frozen render simulation started")
    }

    private fun simulateSlowRendering(
        activity: Activity,
        renderDelayMs: Long,
        color: Int,
        refreshIntervalMs: Long = DEFAULT_REFRESH_INTERVAL_MS,
        durationMs: Long = DEFAULT_TEST_DURATION_MS
    ) {
        val slowRenderView = SlowRenderView(
            activity.baseContext,
            renderDelayMs,
            color,
            refreshIntervalMs
        )

        slowRenderView.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )

        val rootView = activity.window.decorView
            .findViewById<ViewGroup>(android.R.id.content)

        rootView.addView(slowRenderView)

        mainHandler.postDelayed({
            rootView.removeView(slowRenderView)
            slowRenderView.stopRendering()
        }, durationMs)
    }

    private class SlowRenderView(
        context: android.content.Context,
        private val renderDelayMs: Long,
        private val shapeColor: Int,
        private val refreshIntervalMs: Long
    ) : View(context) {

        private val shapePaint = Paint().apply { color = shapeColor }
        private val randomGenerator = java.util.Random()
        private val renderHandler = Handler(Looper.getMainLooper())

        init {
            startSlowRendering()
        }

        private fun startSlowRendering() {
            invalidate()
            renderHandler.postDelayed({ startSlowRendering() }, refreshIntervalMs)
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val renderStartTime = SystemClock.elapsedRealtime()

            // Draw until target delay time is consumed
            while (SystemClock.elapsedRealtime() - renderStartTime < renderDelayMs) {
                repeat(CIRCLES_PER_FRAME) {
                    if (width > 0 && height > 0) {
                        canvas.drawCircle(
                            randomGenerator.nextFloat() * width,
                            randomGenerator.nextFloat() * height,
                            CIRCLE_RADIUS,
                            shapePaint
                        )
                    }
                }
            }
        }

        fun stopRendering() {
            renderHandler.removeCallbacksAndMessages(null)
        }
    }

    
    @ReactMethod
    fun testOkHttpGet(url: String?, promise: Promise) {
        executor.execute {
            try {
                val targetUrl = url ?: "https://mockhttp.org/headers"
                val request = buildRandomOkHttpRequest(targetUrl)
                
                // Use OkHttp client - automatically instrumented by gradle plugin
                okHttpClient.newCall(request).execute().use { response ->
                    val message = "OkHttp request to ${request.url} completed with code ${response.code}"
                    Log.d(TAG, message)
                    mainHandler.post { promise.resolve(message) }
                }
            } catch (e: Exception) {
                Log.e(TAG, "OkHttp request failed", e)
                mainHandler.post { promise.reject("NETWORK_ERROR", e.message, e) }
            }
        }
    }

    private fun buildRandomOkHttpRequest(defaultUrl: String): Request {
        return when (Random.nextInt(3)) {
            0 -> Request.Builder()
                .url("https://mockhttp.org/#tag/images/GET/image")
                .get()
                .addCommonHeaders()
                .build()
            1 -> Request.Builder()
                .url("https://mockhttp.org/#tag/status-codes/GET/status/{code}?")
                .get()
                .addCommonHeaders()
                .build()
            else -> {
                val markdown = """
                    # Splunk RN Test App
                    *Network test from React Native example.*
                """.trimIndent()
                
                Request.Builder()
                    .url("https://mockhttp.org/#tag/response-formats/GET/plain")
                    .post(markdown.toRequestBody("text/plain; charset=utf-8".toMediaType()))
                    .addCommonHeaders()
                    .header("Content-Type", "text/plain; charset=utf-8")
                    .build()
            }
        }
    }

    private fun Request.Builder.addCommonHeaders(): Request.Builder {
        return header("User-Agent", "SplunkRNTestApp/1.0 (Android)")
            .header("Accept", "application/json, text/plain;q=0.8")
            .header("Accept-Language", "en-US")
            .header("Cache-Control", "no-cache")
    }

    @ReactMethod
    fun testHttpUrlConnectionGet(url: String?, promise: Promise) {
        executor.execute {
            var connection: HttpURLConnection? = null
            try {
                val targetUrl = url ?: "https://mockhttp.org/#tag/http-methods/GET/get"
                connection = URL(targetUrl).openConnection() as HttpURLConnection
                connection.setRequestProperty("Accept", "application/json")

                val responseCode = connection.responseCode
                val responseMessage = connection.responseMessage

                val message = "HttpURLConnection response: $responseCode $responseMessage"
                Log.d(TAG, message)
                mainHandler.post { promise.resolve(message) }

            } catch (e: Exception) {
                Log.e(TAG, "HttpURLConnection request failed", e)
                mainHandler.post { promise.reject("NETWORK_ERROR", e.message, e) }
            } finally {
                connection?.disconnect()
            }
        }
    }

    // iOS-only methods (stubs)
    @ReactMethod
    fun testURLSessionGet(url: String?, promise: Promise) {
        promise.reject("PLATFORM_ERROR", "URLSession is only available on iOS")
    }
}
