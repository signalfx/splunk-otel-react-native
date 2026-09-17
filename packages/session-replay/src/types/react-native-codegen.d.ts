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

/*
 * Declarations for the React Native codegen helpers.
 *
 * Component specs have to import these from `react-native/Libraries/*`, because
 * the package root only re-exports them from React Native 0.80 onwards and this
 * package supports 0.75. Those deep paths are mapped to `null` under the
 * `react-native-strict-api` TypeScript condition this repo compiles with, so
 * they need declaring here. Only TypeScript is affected - Metro does not apply
 * that condition, and the underlying modules exist in every supported version.
 */

declare module 'react-native/Libraries/Utilities/codegenNativeComponent' {
  import type { HostComponent } from 'react-native';

  export default function codegenNativeComponent<Props extends {}>(
    componentName: string,
    options?: {
      interfaceOnly?: boolean;
      paperComponentName?: string;
      excludedPlatforms?: ReadonlyArray<'iOS' | 'android'>;
    }
  ): HostComponent<Props>;
}

declare module 'react-native/Libraries/Types/CodegenTypes' {
  /** A prop with a native-side default, which codegen reads from the type. */
  export type WithDefault<Type, Default> = Type | Default | null | undefined;

  export type Int32 = number;
  export type Double = number;
  export type Float = number;
}
