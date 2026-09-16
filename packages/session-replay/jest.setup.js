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

jest.mock('./src/specs/NativeSplunkSessionReplay', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({}),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockResolvedValue({
      status: 'notStarted',
      isRecording: false,
      samplingRate: 1.0,
      renderingMode: 'native',
    }),
    getRecordingMask: jest.fn().mockResolvedValue(null),
    setRecordingMask: jest.fn().mockResolvedValue(undefined),
    setViewSensitivity: jest.fn().mockResolvedValue(true),
    clearViewSensitivity: jest.fn().mockResolvedValue(true),
    setClassSensitivity: jest.fn().mockResolvedValue(undefined),
    clearClassSensitivity: jest.fn().mockResolvedValue(undefined),
    getClassSensitivity: jest.fn().mockResolvedValue('unset'),
    setRenderingMode: jest.fn().mockResolvedValue(undefined),
  },
}));
