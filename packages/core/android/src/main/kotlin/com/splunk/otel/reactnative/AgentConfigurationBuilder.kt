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

import com.facebook.react.bridge.ReadableMap
import com.splunk.rum.integration.agent.api.AgentConfiguration
import com.splunk.rum.integration.agent.api.EndpointConfiguration
import com.splunk.rum.integration.agent.api.user.UserTrackingMode
import io.opentelemetry.api.common.Attributes
import java.net.URL

/**
 * Builds native AgentConfiguration from the TS API.
 */
object AgentConfigurationBuilder {

  fun build(map: ReadableMap): AgentConfiguration {
    val endpointMapAny = map.getMap("endpoint")
      ?: throw IllegalArgumentException("endpoint is required")
    val endpointMap = endpointMapAny as ReadableMap

    val endpoint = if (endpointMap.hasKey("realm")) {
      EndpointConfiguration(endpointMap.getString("realm")!!, endpointMap.getString("rumAccessToken")!!)
    } else if (endpointMap.hasKey("trace")) {
      val traceStr = endpointMap.getString("trace")
        ?: throw IllegalArgumentException("trace must be a non-null string")
      val trace = URL(traceStr)

      val srStr = if (endpointMap.hasKey("sessionReplay")) endpointMap.getString("sessionReplay") else null

      val sr = srStr?.let { URL(it) }
      if (sr != null) EndpointConfiguration(trace, sr) else EndpointConfiguration(trace)
    } else {
      throw IllegalArgumentException("endpoint must specify either realm/rumAccessToken or trace")
    }

    val appName = map.getString("appName") ?: ""
    val deployment = map.getString("deploymentEnvironment") ?: ""
    val appVersion = if (map.hasKey("appVersion")) map.getString("appVersion") else null
    val enableDebug = map.getBoolean("enableDebugLogging")
    val global = if (map.hasKey("globalAttributes")) AttributeConverter.buildAttributesFromMap(map.getMap("globalAttributes")!!) else Attributes.empty()
    val instrumentedProcessName = if (map.hasKey("instrumentedProcessName")) map.getString("instrumentedProcessName") else null
    val deferredUntilForeground = map.getBoolean("deferredUntilForeground")

    val userMap = if (map.hasKey("user")) map.getMap("user") else null
    val userConfig = com.splunk.rum.integration.agent.api.user.UserConfiguration(
      trackingMode = userMap?.getString("trackingMode")?.let { UserTrackingMode.valueOf(it) } ?: UserTrackingMode.NO_TRACKING
    )

    val sessionMap = if (map.hasKey("session")) map.getMap("session") else null
    val sessionConfig = com.splunk.rum.integration.agent.api.session.SessionConfiguration(
      samplingRate = sessionMap?.getDouble("samplingRate") ?: 1.0
    )

    return AgentConfiguration(
      endpoint = endpoint,
      appName = appName,
      deploymentEnvironment = deployment,
      appVersion = appVersion,
      enableDebugLogging = enableDebug,
      globalAttributes = global,
      user = userConfig,
      session = sessionConfig,
      instrumentedProcessName = instrumentedProcessName,
      deferredUntilForeground = deferredUntilForeground,
    )
  }
}
