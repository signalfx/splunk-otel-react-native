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

import {
  TurboModuleRegistry,
  NativeModules,
  type TurboModule,
} from 'react-native';

export type NativeSessionReplayState = {
  status: string;
  isRecording: boolean;
  samplingRate: number;
  renderingMode: string;
};

export type NativeMaskElement = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
};

export type NativeRecordingMask = {
  elements: NativeMaskElement[];
};

export interface Spec extends TurboModule {
  readonly getConstants: () => {};

  start(): Promise<void>;
  stop(): Promise<void>;

  getState(): Promise<NativeSessionReplayState>;

  getRecordingMask(): Promise<NativeRecordingMask | null>;
  setRecordingMask(mask: { [key: string]: unknown } | null): Promise<void>;

  /**
   * Marks the native view backing `reactTag` as sensitive (or explicitly not
   * sensitive). Resolves to `false` when the tag could not be resolved to a
   * native view, which happens for views React Native collapsed away.
   */
  setViewSensitivity(reactTag: number, isSensitive: boolean): Promise<boolean>;

  /**
   * Removes an instance-level override, letting the class-level default apply
   * again. Must be called when a marked view unmounts, because both platforms
   * recycle native views across unrelated components.
   */
  clearViewSensitivity(reactTag: number): Promise<boolean>;

  /**
   * Applies sensitivity to every current and future instance of a native view
   * class. `className` is a fully qualified Java class name on Android and an
   * Objective-C runtime class name on iOS.
   */
  setClassSensitivity(className: string, isSensitive: boolean): Promise<void>;
  clearClassSensitivity(className: string): Promise<void>;

  /** Returns `'sensitive' | 'notSensitive' | 'unset'`. */
  getClassSensitivity(className: string): Promise<string>;

  /**
   * Sets the preferred capture mode, `'native'` or `'wireframeOnly'`. The
   * effective mode is reported by `getState`.
   */
  setRenderingMode(mode: string): Promise<void>;
}

const Turbo = TurboModuleRegistry.get<Spec>('SplunkSessionReplay');
const Legacy = (NativeModules as any).SplunkSessionReplay as Spec | undefined;

if (!Turbo && !Legacy) {
  throw new Error('Native module SplunkSessionReplay is not linked.');
}

export default (Turbo ?? Legacy)!;
