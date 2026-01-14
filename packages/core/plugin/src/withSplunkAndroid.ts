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

import {
  withProjectBuildGradle,
  type ConfigPlugin,
} from '@expo/config-plugins';
import type { SplunkOtelPluginProps } from './index';

const SPLUNK_MAVEN_URL =
  'https://splunk.jfrog.io/splunk/splunk-rum-android-releases';

/**
 * Adds the Splunk Maven repository to the Android project's build.gradle.
 *
 * This is required because the Splunk Android SDK is hosted on a custom Maven repository.
 */
export const withSplunkAndroid: ConfigPlugin<SplunkOtelPluginProps> = (
  config,
  props
) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        'Cannot configure Splunk OTel for Android because the project build.gradle is not in Groovy'
      );
    }

    config.modResults.contents = addMavenRepository(
      config.modResults.contents,
      props.androidMavenRepository ?? SPLUNK_MAVEN_URL
    );

    return config;
  });
};

/**
 * Adds the Splunk Maven repository to the allprojects.repositories block.
 */
function addMavenRepository(buildGradle: string, mavenUrl: string): string {
  const mavenLine = `        maven { url "${mavenUrl}" }`;

  // Check if already added
  if (buildGradle.includes(mavenUrl)) {
    return buildGradle;
  }

  // Pattern to match allprojects { repositories { ... } }
  const allProjectsRepoPattern = /allprojects\s*\{[^}]*repositories\s*\{/;
  const allProjectsMatch = buildGradle.match(allProjectsRepoPattern);

  if (allProjectsMatch) {
    // Add after the repositories opening brace
    return buildGradle.replace(
      allProjectsRepoPattern,
      `${allProjectsMatch[0]}\n${mavenLine}`
    );
  }

  // If no allprojects block exists, try to add to the dependencyResolutionManagement block
  // This is the newer Gradle approach used by recent React Native versions
  const dependencyResolutionPattern =
    /dependencyResolutionManagement\s*\{[^}]*repositories\s*\{/;
  const dependencyResolutionMatch = buildGradle.match(
    dependencyResolutionPattern
  );

  if (dependencyResolutionMatch) {
    return buildGradle.replace(
      dependencyResolutionPattern,
      `${dependencyResolutionMatch[0]}\n${mavenLine}`
    );
  }

  // As a fallback, append an allprojects block at the end
  const allProjectsBlock = `
allprojects {
    repositories {
${mavenLine}
    }
}
`;

  return buildGradle + allProjectsBlock;
}
