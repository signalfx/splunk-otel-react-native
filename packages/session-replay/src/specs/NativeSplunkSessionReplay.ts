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
  setRecordingMask(
    mask: { elements: Array<{ [key: string]: unknown }> } | null
  ): Promise<void>;
}

const Turbo = TurboModuleRegistry.get<Spec>('SplunkSessionReplay');
const Legacy = (NativeModules as any).SplunkSessionReplay as Spec | undefined;

if (!Turbo && !Legacy) {
  throw new Error('Native module SplunkSessionReplay is not linked.');
}

export default (Turbo ?? Legacy)!;
