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

import type { ViewProps } from 'react-native';
// Imported from these paths rather than the package entry point because the
// root re-exports of the codegen helpers only exist from React Native 0.80
// onwards, and this package supports 0.75. The entry point eagerly re-exports
// SensitiveView, so an undefined import here would throw while merely loading
// the package, breaking every API in it.
//
// The strict type API marks `react-native/Libraries/*` unresolvable for
// TypeScript, which is why these two modules are declared in
// `src/types/react-native-codegen.d.ts`. Metro does not apply that condition,
// so it resolves them at runtime on every supported version.
// eslint-disable-next-line @react-native/no-deep-imports -- the top level
// import this rule suggests does not exist before React Native 0.80, and
// auto-fixing it would break loading this package on 0.75.
import type { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
// eslint-disable-next-line @react-native/no-deep-imports -- see above
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  /**
   * Whether the view and everything drawn inside it is masked in session
   * replay recordings.
   *
   * Owning this as a native prop is the point of having a host component: the
   * flag is set when the view is created and released with it, so there is no
   * React tag to resolve and nothing to clear on unmount.
   */
  sensitive?: WithDefault<boolean, true>;
}

export default codegenNativeComponent<NativeProps>('SplunkSensitiveView');
