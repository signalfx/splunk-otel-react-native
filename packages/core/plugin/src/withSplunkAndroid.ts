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
  WarningAggregator,
  withAppBuildGradle,
  withProjectBuildGradle,
  type ConfigPlugin,
} from '@expo/config-plugins';
import type { SplunkOtelPluginProps } from './index';

const SPLUNK_MAVEN_URL =
  'https://splunk.jfrog.io/splunk/splunk-rum-android-releases';
const DESUGAR_JDK_LIBS = 'com.android.tools:desugar_jdk_libs:2.1.5';
const DESUGARING_FALLBACK_TAG =
  '// @splunk/otel-react-native desugaring fallback';

/**
 * Configures the Maven repository and app-level desugaring for Android.
 */
export const withSplunkAndroid: ConfigPlugin<SplunkOtelPluginProps> = (
  config,
  props
) => {
  config = withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error(
        'Cannot configure Splunk OTel for Android because the project build.gradle is not in Groovy'
      );
    }

    modConfig.modResults.contents = addMavenRepository(
      modConfig.modResults.contents,
      props.androidMavenRepository ?? SPLUNK_MAVEN_URL
    );

    return modConfig;
  });

  return withAppBuildGradle(config, (modConfig) => {
    const gradle = modConfig.modResults;
    if (gradle.language === 'groovy') {
      gradle.contents = configureDesugaring(gradle.contents);
    } else {
      warnAboutManualDesugaring('the app Gradle file uses Kotlin DSL');
    }
    return modConfig;
  });
};

function configureDesugaring(contents: string): string {
  // Ignore comments while retaining quoted dependency names, URLs and globs.
  const source = contents.replace(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g,
    (token) => (token.startsWith('/') ? '' : token)
  );
  const hasFlag =
    /\bcoreLibraryDesugaringEnabled(?:\s*=(?!=)|\s*\(|[ \t]+[\w!])|\bsetCoreLibraryDesugaringEnabled\s*\(/.test(
      source
    );
  const hasDependency =
    contents.split(/\r?\n/).includes(DESUGARING_FALLBACK_TAG) ||
    /\bcoreLibraryDesugaring(?:\s*\(|[ \t]+[\w'"]|\.defaultDependencies\b)|\badd\s*\(\s*['"]coreLibraryDesugaring['"]/.test(
      source
    );
  if (
    /\b(?:coreLibraryDesugaringEnabled|setCoreLibraryDesugaringEnabled)\s*[=(]?\s*false\b/.test(
      source
    )
  ) {
    warnAboutManualDesugaring('the app explicitly disables it');
    return contents;
  }
  if (hasFlag && hasDependency) {
    return contents;
  }
  if (!/^android\s*\{/m.test(source) || !/^dependencies\s*\{/m.test(source)) {
    warnAboutManualDesugaring('the app Gradle layout is unrecognized');
    return contents;
  }

  // Separate blocks keep the original Gradle DSL and compiler targets intact.
  const blocks: string[] = [];
  if (!hasFlag) {
    blocks.push(`android {
    compileOptions {
        coreLibraryDesugaringEnabled true
    }
}`);
  }
  if (!hasDependency) {
    // Declare the fallback after the app has configured its dependencies.
    blocks.push(`${DESUGARING_FALLBACK_TAG}
afterEvaluate {
    if (configurations.coreLibraryDesugaring.allDependencies.isEmpty()) {
        dependencies.add("coreLibraryDesugaring", "${DESUGAR_JDK_LIBS}")
    }
}`);
  }
  return `${contents}${contents.endsWith('\n') ? '' : '\n'}\n${blocks.join('\n\n')}\n`;
}

function warnAboutManualDesugaring(reason: string): void {
  WarningAggregator.addWarningAndroid(
    '@splunk/otel-react-native',
    `Splunk could not configure core library desugaring because ${reason}. See the Android setup in the Splunk React Native SDK README.`
  );
}

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
