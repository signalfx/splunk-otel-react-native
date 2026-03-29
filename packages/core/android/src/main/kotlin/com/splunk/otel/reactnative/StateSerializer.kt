/*
 * Copyright 2025 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.splunk.otel.reactnative

import com.facebook.react.bridge.WritableNativeMap
import com.splunk.rum.integration.agent.api.IState
import com.splunk.rum.integration.agent.api.Status

/**
 * Serializes agent state objects for the TS API consumption.
 */
object StateSerializer {

  fun serializeAgentState(state: IState): WritableNativeMap {
    val map = WritableNativeMap()
    map.putString("appName", state.appName)
    map.putString("appVersion", state.appVersion)
    map.putString("deploymentEnvironment", state.deploymentEnvironment)
    map.putBoolean("isDebugLoggingEnabled", state.isDebugLoggingEnabled)
    map.putString("instrumentedProcessName", state.instrumentedProcessName)
    map.putBoolean("deferredUntilForeground", state.deferredUntilForeground)

    val statusMap = when (val currentStatus = state.status) {
      is Status.Running -> WritableNativeMap().apply { putString("type", "Running") }
      is Status.NotRunning -> WritableNativeMap().apply {
        putString("type", "NotRunning")
        val reason = when (currentStatus) {
          Status.NotRunning.NotInstalled -> "NotInstalled"
          Status.NotRunning.Subprocess -> "Subprocess"
          Status.NotRunning.SampledOut -> "SampledOut"
          Status.NotRunning.UnsupportedOsVersion -> "UnsupportedOsVersion"
        }

        putString("reason", reason)
      }
    }

    map.putMap("status", statusMap)

    val ep = state.endpointConfiguration
    if (ep != null) {
      val endpointMap = WritableNativeMap()
      if (ep.realm != null) {
        endpointMap.putString("realm", ep.realm)
        endpointMap.putString("rumAccessToken", ep.rumAccessToken)
      } else {
        endpointMap.putString("trace", ep.traceEndpoint.toString())
        if (ep.sessionReplayEndpoint != null) {
          endpointMap.putString("sessionReplay", ep.sessionReplayEndpoint.toString())
        }
      }
      map.putMap("endpoint", endpointMap)
    } else {
      map.putNull("endpoint")
    }

    return map
  }
}
