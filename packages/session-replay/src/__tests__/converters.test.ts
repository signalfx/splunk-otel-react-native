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
  fromNativeState,
  fromNativePreferences,
  fromNativeRecordingMask,
  toNativeRenderingMode,
  toNativeRecordingMask,
} from '../bridge/converters';
import { SessionReplayStatus } from '../model/SessionReplayStatus';
import { RenderingMode } from '../model/RenderingMode';
import { MaskType } from '../model/MaskType';

describe('converters', () => {
  describe('fromNativeState', () => {
    it('maps recording state', () => {
      const state = fromNativeState({
        status: 'recording',
        isRecording: true,
        renderingMode: 'native',
        samplingRate: 1.0,
      });

      expect(state).toEqual({
        status: SessionReplayStatus.RECORDING,
        isRecording: true,
        renderingMode: RenderingMode.NATIVE,
        samplingRate: 1.0,
      });
    });

    it('maps notStarted state with wireframeOnly mode', () => {
      const state = fromNativeState({
        status: 'notStarted',
        isRecording: false,
        renderingMode: 'wireframeOnly',
        samplingRate: 0.5,
      });

      expect(state).toEqual({
        status: SessionReplayStatus.NOT_RECORDING_NOT_STARTED,
        isRecording: false,
        renderingMode: RenderingMode.WIREFRAME_ONLY,
        samplingRate: 0.5,
      });
    });

    it('maps all not-recording causes', () => {
      const causes: Array<[string, SessionReplayStatus]> = [
        ['notStarted', SessionReplayStatus.NOT_RECORDING_NOT_STARTED],
        ['stopped', SessionReplayStatus.NOT_RECORDING_STOPPED],
        ['internalError', SessionReplayStatus.NOT_RECORDING_INTERNAL_ERROR],
        [
          'unsupportedPlatform',
          SessionReplayStatus.NOT_RECORDING_UNSUPPORTED_PLATFORM,
        ],
        [
          'storageLimitReached',
          SessionReplayStatus.NOT_RECORDING_STORAGE_LIMIT_REACHED,
        ],
        [
          'disabledBySampling',
          SessionReplayStatus.NOT_RECORDING_DISABLED_BY_SAMPLING,
        ],
        [
          'swiftUIPreviewContext',
          SessionReplayStatus.NOT_RECORDING_SWIFT_UI_PREVIEW_CONTEXT,
        ],
        [
          'belowMinSdkVersion',
          SessionReplayStatus.NOT_RECORDING_BELOW_MIN_SDK_VERSION,
        ],
      ];

      for (const [native, expected] of causes) {
        const state = fromNativeState({
          status: native,
          isRecording: false,
          renderingMode: 'native',
          samplingRate: 1.0,
        });
        expect(state.status).toBe(expected);
      }
    });

    it('falls back to notStarted for unknown status', () => {
      const state = fromNativeState({
        status: 'unknownFutureStatus',
        isRecording: false,
        renderingMode: 'native',
        samplingRate: 1.0,
      });

      expect(state.status).toBe(SessionReplayStatus.NOT_RECORDING_NOT_STARTED);
    });

    it('falls back to native for unknown rendering mode', () => {
      const state = fromNativeState({
        status: 'recording',
        isRecording: true,
        renderingMode: 'unknownMode',
        samplingRate: 1.0,
      });

      expect(state.renderingMode).toBe(RenderingMode.NATIVE);
    });
  });

  describe('fromNativePreferences', () => {
    it('maps rendering mode', () => {
      expect(fromNativePreferences({ renderingMode: 'native' })).toEqual({
        renderingMode: RenderingMode.NATIVE,
      });
      expect(
        fromNativePreferences({ renderingMode: 'wireframeOnly' })
      ).toEqual({
        renderingMode: RenderingMode.WIREFRAME_ONLY,
      });
    });

    it('maps null rendering mode to undefined', () => {
      expect(fromNativePreferences({ renderingMode: null })).toEqual({
        renderingMode: undefined,
      });
    });
  });

  describe('toNativeRenderingMode', () => {
    it('passes through mode string', () => {
      expect(toNativeRenderingMode(RenderingMode.NATIVE)).toBe('native');
      expect(toNativeRenderingMode(RenderingMode.WIREFRAME_ONLY)).toBe(
        'wireframeOnly'
      );
    });

    it('maps undefined to null', () => {
      expect(toNativeRenderingMode(undefined)).toBeNull();
    });
  });

  describe('fromNativeRecordingMask', () => {
    it('maps null to null', () => {
      expect(fromNativeRecordingMask(null)).toBeNull();
    });

    it('maps elements', () => {
      const mask = fromNativeRecordingMask({
        elements: [
          { x: 10, y: 20, width: 100, height: 50, type: 'covering' },
          { x: 30, y: 40, width: 60, height: 80, type: 'erasing' },
        ],
      });

      expect(mask).toEqual({
        elements: [
          {
            rect: { x: 10, y: 20, width: 100, height: 50 },
            type: MaskType.COVERING,
          },
          {
            rect: { x: 30, y: 40, width: 60, height: 80 },
            type: MaskType.ERASING,
          },
        ],
      });
    });

    it('falls back to covering for unknown type', () => {
      const mask = fromNativeRecordingMask({
        elements: [{ x: 0, y: 0, width: 10, height: 10, type: 'unknown' }],
      });

      expect(mask!.elements[0]!.type).toBe(MaskType.COVERING);
    });
  });

  describe('toNativeRecordingMask', () => {
    it('maps null to null', () => {
      expect(toNativeRecordingMask(null)).toBeNull();
    });

    it('maps elements to flat structure', () => {
      const native = toNativeRecordingMask({
        elements: [
          {
            rect: { x: 10, y: 20, width: 100, height: 50 },
            type: MaskType.COVERING,
          },
          {
            rect: { x: 30, y: 40, width: 60, height: 80 },
            type: MaskType.ERASING,
          },
        ],
      });

      expect(native).toEqual({
        elements: [
          { x: 10, y: 20, width: 100, height: 50, type: 'covering' },
          { x: 30, y: 40, width: 60, height: 80, type: 'erasing' },
        ],
      });
    });
  });
});
