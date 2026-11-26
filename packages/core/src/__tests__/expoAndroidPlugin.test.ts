/*
 * Copyright 2026 Splunk Inc.
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

import { WarningAggregator, type ExportedConfig } from '@expo/config-plugins';
import { withSplunkAndroid } from '../../plugin/src/withSplunkAndroid';

// These top-level blocks are shared by the Expo SDK 54 and 55 Groovy templates.
const appGradle = `apply plugin: "com.android.application"

react {
    autolinkLibrariesWithApp()
}

android {
    namespace "com.example"
}

dependencies {
    implementation("com.facebook.react:react-android")
}
`;
const desugarFlag = 'coreLibraryDesugaringEnabled true';
const desugarDependency = 'com.android.tools:desugar_jdk_libs:2.1.5';

async function runGradleMod(
  mod: 'appBuildGradle' | 'projectBuildGradle',
  contents: string,
  language: 'groovy' | 'kt' = 'groovy'
) {
  const app = { name: 'Example', slug: 'example' };
  const config: ExportedConfig = withSplunkAndroid(app, {
    androidMavenRepository: 'https://example.com/maven',
  });
  const transform = config.mods?.android?.[mod];
  if (!transform) {
    throw new Error(`Expected the plugin to register the ${mod} mod`);
  }
  const result = await transform({
    ...config,
    modRawConfig: app,
    modRequest: {
      projectRoot: '/example',
      platformProjectRoot: '/example/android',
      modName: mod,
      platform: 'android',
      introspect: false,
    },
    modResults: { contents, language, path: 'build.gradle' },
  });
  return result.modResults.contents;
}

afterEach(() => {
  jest.restoreAllMocks();
});

it('adds desugaring once to a clean app and keeps the root Maven mod', async () => {
  const result = await runGradleMod('appBuildGradle', appGradle);
  expect(result.startsWith(appGradle)).toBe(true);
  expect(result).toContain(desugarFlag);
  expect(result).toContain(desugarDependency);
  expect(result).toContain(
    '// @splunk/otel-react-native desugaring fallback\nafterEvaluate {'
  );
  expect(await runGradleMod('appBuildGradle', result)).toBe(result);
  expect(
    await runGradleMod('projectBuildGradle', 'allprojects { repositories { } }')
  ).toContain('maven { url "https://example.com/maven" }');
});

it.each([
  [desugarFlag, '', desugarDependency],
  ['', 'add("coreLibraryDesugaring", libs.desugarJdkLibs)', desugarFlag],
])(
  'adds only the missing desugaring setting (%s %s)',
  async (flag, dep, added) => {
    const existing = appGradle
      .replace(
        '    namespace',
        `    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
        ${flag}
    }
    namespace`
      )
      .replace('    implementation', `    ${dep}\n    implementation`);
    const result = await runGradleMod('appBuildGradle', existing);
    expect(result.startsWith(existing)).toBe(true);
    const appended = result.slice(existing.length);
    expect(appended).toContain(added);
    expect(appended).not.toContain(flag || 'libs.desugarJdkLibs');
    if (dep) {
      expect(appended).not.toContain(desugarDependency);
    }
    expect(await runGradleMod('appBuildGradle', result)).toBe(result);
  }
);

it('preserves a complete existing setup and dependency version', async () => {
  const existing =
    appGradle +
    `android { compileOptions { ${desugarFlag} } }
dependencies { coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.6' }
`;
  expect(await runGradleMod('appBuildGradle', existing)).toBe(existing);
});

it('preserves a default declared by the app', async () => {
  const existing =
    appGradle +
    `android { compileOptions { ${desugarFlag} } }
configurations.coreLibraryDesugaring.defaultDependencies {
    it.add(project.dependencies.create("com.android.tools:desugar_jdk_libs:2.1.3"))
}
`;
  expect(await runGradleMod('appBuildGradle', existing)).toBe(existing);
});

it('ignores commented-out desugaring settings', async () => {
  const commented =
    appGradle.replace(
      'namespace "com.example"',
      'namespace "com.example" // coreLibraryDesugaringEnabled false'
    ) +
    '/* coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5") */\n';
  const result = await runGradleMod('appBuildGradle', commented);
  expect(result.slice(commented.length)).toContain(desugarFlag);
  expect(result.slice(commented.length)).toContain(desugarDependency);
});

it('adds desugaring when the app only reads its configuration', async () => {
  const existing =
    appGradle +
    'println(android.compileOptions.coreLibraryDesugaringEnabled)\n' +
    'println(configurations.coreLibraryDesugaring.allDependencies)\n';
  const result = await runGradleMod('appBuildGradle', existing);
  expect(result.slice(existing.length)).toContain(desugarFlag);
  expect(result.slice(existing.length)).toContain(desugarDependency);
});

it.each([
  ['kt', appGradle, 'uses Kotlin DSL'],
  ['groovy', 'apply from: "custom.gradle"', 'layout is unrecognized'],
  [
    'groovy',
    appGradle +
      'android { compileOptions { coreLibraryDesugaringEnabled = false } }',
    'explicitly disables it',
  ],
] as const)(
  'leaves unsupported or explicitly disabled setup intact (%s)',
  async (language, contents, reason) => {
    const warning = jest
      .spyOn(WarningAggregator, 'addWarningAndroid')
      .mockImplementation(() => {});
    expect(await runGradleMod('appBuildGradle', contents, language)).toBe(
      contents
    );
    expect(warning).toHaveBeenCalledWith(
      '@splunk/otel-react-native',
      expect.stringContaining(reason)
    );
  }
);
