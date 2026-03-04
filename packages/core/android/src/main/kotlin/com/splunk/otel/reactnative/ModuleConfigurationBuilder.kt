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

import com.facebook.react.bridge.ReadableArray
import com.splunk.rum.integration.agent.common.module.ModuleConfiguration
import com.splunk.rum.integration.anr.AnrModuleConfiguration
import com.splunk.rum.integration.applicationlifecycle.ApplicationLifecycleModuleConfiguration
import com.splunk.rum.integration.crash.CrashModuleConfiguration
import com.splunk.rum.integration.httpurlconnection.auto.HttpURLModuleConfiguration
import com.splunk.rum.integration.interactions.InteractionsModuleConfiguration
import com.splunk.rum.integration.navigation.NavigationModuleConfiguration
import com.splunk.rum.integration.networkmonitor.NetworkMonitorModuleConfiguration
import com.splunk.rum.integration.okhttp3.auto.OkHttp3AutoModuleConfiguration
import com.splunk.rum.integration.okhttp3.manual.OkHttp3ManualModuleConfiguration
import com.splunk.rum.integration.sessionreplay.SessionReplayModuleConfiguration
import com.splunk.rum.integration.slowrendering.SlowRenderingModuleConfiguration
import com.splunk.rum.integration.startup.StartupModuleConfiguration
import java.time.Duration

/**
 * Builds module configurations received from the TS API.
 */
object ModuleConfigurationBuilder {

  fun build(array: ReadableArray): List<ModuleConfiguration> {
    val list = mutableListOf<ModuleConfiguration>()

    for (i in 0 until array.size()) {
      val m = array.getMap(i)
      val name = m?.getString("name") ?: continue
      val attrs = m.getMap("attributes")

      when (name) {
        "startup" -> list += StartupModuleConfiguration()
        "anr" -> list += AnrModuleConfiguration(attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true)
        "applicationLifecycle" -> list += ApplicationLifecycleModuleConfiguration(attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true)
        "crash" -> list += CrashModuleConfiguration(attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true)
        "httpURLConnection" -> list += HttpURLModuleConfiguration(
          attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true,
          splitCsv(attrs?.getString("requestHeaders")),
          splitCsv(attrs?.getString("responseHeaders")),
        )
        "interactions" -> list += InteractionsModuleConfiguration(attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true)
        "navigation" -> list += NavigationModuleConfiguration(
          attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true,
          attrs?.getString("isAutomatedTrackingEnabled")?.toBooleanStrictOrNull() ?: false,
        )
        "networkMonitor" -> list += NetworkMonitorModuleConfiguration(attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true)
        "okHttp3-auto" -> list += OkHttp3AutoModuleConfiguration(
          attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true,
          splitCsv(attrs?.getString("requestHeaders")),
          splitCsv(attrs?.getString("responseHeaders")),
        )
        "okHttp3-manual" -> list += OkHttp3ManualModuleConfiguration(
          splitCsv(attrs?.getString("requestHeaders")),
          splitCsv(attrs?.getString("responseHeaders")),
        )
        "slowrendering" -> list += SlowRenderingModuleConfiguration(
          attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true,
          run {
            val interval = attrs?.getString("interval")
            
            @Suppress("NewApi")
            if (!interval.isNullOrEmpty() && interval.startsWith("PT")) Duration.parse(interval) else Duration.ofSeconds(1)
          }
        )
        "sessionReplay" -> try {
          list += SessionReplayModuleConfiguration(
            attrs?.getString("enabled")?.toBooleanStrictOrNull() ?: true,
            attrs?.getString("samplingRate")?.toFloatOrNull() ?: 1.0f,
          )
        } catch (_: NoClassDefFoundError) {
          // session-replay RN package not installed - just skip
        }
      }
    }

    return list
  }

  private fun splitCsv(csv: String?): List<String> =
    if (csv.isNullOrEmpty()) emptyList() else csv.split(',').map { it.trim() }.filter { it.isNotEmpty() }
}
