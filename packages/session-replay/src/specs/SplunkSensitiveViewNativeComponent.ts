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

// Imported from the package entry point rather than deep paths, because the
// React Native strict type API blocks `react-native/Libraries/*`.
import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
} from 'react-native';

export interface NativeProps extends ViewProps {
  /**
   * Whether the view and everything drawn inside it is masked in session
   * replay recordings.
   *
   * Owning this as a native prop is the point of having a host component: the
   * flag is set when the view is created and released with it, so there is no
   * React tag to resolve and nothing to clear on unmount.
   */
  sensitive?: CodegenTypes.WithDefault<boolean, true>;
}

export default codegenNativeComponent<NativeProps>('SplunkSensitiveView');
