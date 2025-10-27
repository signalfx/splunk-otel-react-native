package com.splunk.otel.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SplunkOtelReactNativeModule.NAME)
class SplunkOtelReactNativeModule(reactContext: ReactApplicationContext) :
  NativeSplunkOtelReactNativeSpec(reactContext) {

  override fun getName(): String = NAME

  override fun multiply(a: Double, b: Double, promise: Promise) {
    promise.resolve(a * b)
  }

  companion object {
    const val NAME = "SplunkOtelReactNative"
  }
}


