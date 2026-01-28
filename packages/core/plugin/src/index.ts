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

import { createRunOncePlugin, type ConfigPlugin } from '@expo/config-plugins';
import { withSplunkAndroid } from './withSplunkAndroid';

// Read the package version to tag the plugin
const pkg = require('../../package.json');

export interface SplunkOtelPluginProps {
  /**
   * Optional: Custom Maven repository URL for the Splunk Android SDK.
   * Defaults to the official Splunk repository.
   */
  androidMavenRepository?: string;
}

/**
 * Expo Config Plugin for @splunk/otel-react-native
 *
 * This plugin configures the native Android projects to work with
 * the Splunk OpenTelemetry React Native SDK when using `expo prebuild`.
 */
const withSplunkOtel: ConfigPlugin<SplunkOtelPluginProps | void> = (
  config,
  props = {}
) => {
  const pluginProps: SplunkOtelPluginProps = props ?? {};

  config = withSplunkAndroid(config, pluginProps);

  return config;
};

export default createRunOncePlugin(withSplunkOtel, pkg.name, pkg.version);
