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

import type {
  NativeSessionReplayState,
  NativeRecordingMask,
  NativeMaskElement,
} from '../specs/NativeSplunkSessionReplay';
import { SessionReplayStatus } from '../model/SessionReplayStatus';
import { RenderingMode } from '../model/RenderingMode';
import { MaskType } from '../model/MaskType';
import type { SessionReplayState } from '../model/SessionReplayState';
import type { SessionReplayPreferences } from '../model/SessionReplayPreferences';
import type { RecordingMask, MaskElement } from '../model/RecordingMask';

const STATUS_MAP: Record<string, SessionReplayStatus> = {
  recording: SessionReplayStatus.RECORDING,
  notStarted: SessionReplayStatus.NOT_RECORDING_NOT_STARTED,
  stopped: SessionReplayStatus.NOT_RECORDING_STOPPED,
  internalError: SessionReplayStatus.NOT_RECORDING_INTERNAL_ERROR,
  unsupportedPlatform: SessionReplayStatus.NOT_RECORDING_UNSUPPORTED_PLATFORM,
  storageLimitReached: SessionReplayStatus.NOT_RECORDING_STORAGE_LIMIT_REACHED,
  disabledBySampling: SessionReplayStatus.NOT_RECORDING_DISABLED_BY_SAMPLING,
  swiftUIPreviewContext:
    SessionReplayStatus.NOT_RECORDING_SWIFT_UI_PREVIEW_CONTEXT,
  belowMinSdkVersion: SessionReplayStatus.NOT_RECORDING_BELOW_MIN_SDK_VERSION,
};

const RENDERING_MODE_MAP: Record<string, RenderingMode> = {
  native: RenderingMode.NATIVE,
  wireframeOnly: RenderingMode.WIREFRAME_ONLY,
};

const MASK_TYPE_MAP: Record<string, MaskType> = {
  covering: MaskType.COVERING,
  erasing: MaskType.ERASING,
};

export function fromNativeState(
  native: NativeSessionReplayState
): SessionReplayState {
  return {
    status:
      STATUS_MAP[native.status] ??
      SessionReplayStatus.NOT_RECORDING_NOT_STARTED,
    isRecording: native.isRecording,
    renderingMode:
      RENDERING_MODE_MAP[native.renderingMode] ?? RenderingMode.NATIVE,
    samplingRate: native.samplingRate,
  };
}

export function fromNativePreferences(native: {
  renderingMode: string | null;
}): SessionReplayPreferences {
  return {
    renderingMode: native.renderingMode
      ? RENDERING_MODE_MAP[native.renderingMode]
      : undefined,
  };
}

export function toNativeRenderingMode(
  mode: RenderingMode | undefined
): string | null {
  return mode ?? null;
}

function fromNativeMaskElement(native: NativeMaskElement): MaskElement {
  return {
    rect: {
      x: native.x,
      y: native.y,
      width: native.width,
      height: native.height,
    },
    type: MASK_TYPE_MAP[native.type] ?? MaskType.COVERING,
  };
}

export function fromNativeRecordingMask(
  native: NativeRecordingMask | null
): RecordingMask | null {
  if (!native) return null;

  return { elements: native.elements.map(fromNativeMaskElement) };
}

function toNativeMaskElement(element: MaskElement): NativeMaskElement {
  return {
    x: element.rect.x,
    y: element.rect.y,
    width: element.rect.width,
    height: element.rect.height,
    type: element.type,
  };
}

export function toNativeRecordingMask(
  mask: RecordingMask | null
): NativeRecordingMask | null {
  if (!mask) return null;

  return { elements: mask.elements.map(toNativeMaskElement) };
}
