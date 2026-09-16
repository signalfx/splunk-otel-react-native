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

import Native from './specs/NativeSplunkSessionReplay';
import type { SessionReplayState } from './model/SessionReplayState';
import type { RecordingMask } from './model/RecordingMask';
import { Sensitivity } from './model/Sensitivity';
import { RenderingMode } from './model/RenderingMode';
import { NativeViewClass } from './model/NativeViewClass';
import {
  fromNativeState,
  fromNativeRecordingMask,
  toNativeRecordingMask,
  toSensitivity,
} from './bridge/converters';

/**
 * Session Replay singleton API.
 *
 * Provides control over session replay recording, including
 * start/stop, state inspection, and recording masks.
 *
 * Requires `@splunk/otel-react-native` to be installed first via
 * {@link SplunkRum.install} with a
 * {@link SessionReplayModuleConfiguration} in the modules array.
 *
 * @example
 * ```typescript
 * import { SplunkSessionReplay } from '@splunk/otel-session-replay-react-native';
 *
 * await SplunkSessionReplay.instance.start();
 *
 * const state = await SplunkSessionReplay.instance.getState();
 * console.log(state.status, state.isRecording);
 *
 * await SplunkSessionReplay.instance.stop();
 * ```
 */
export class SplunkSessionReplay {
  private static _instance: SplunkSessionReplay | null = null;

  private constructor() {}

  static get instance(): SplunkSessionReplay {
    if (!this._instance) this._instance = new SplunkSessionReplay();
    return this._instance;
  }

  /**
   * Starts session replay recording.
   *
   * If the SDK is not yet installed or session replay was not configured
   * during install, this is a no-op on the native side.
   */
  start(): Promise<void> {
    return Native.start();
  }

  /**
   * Stops the current session replay recording.
   */
  stop(): Promise<void> {
    return Native.stop();
  }

  /**
   * Returns a snapshot of the current session replay state.
   *
   * The state includes the recording status and the sampling rate
   * applied at install time.
   */
  async getState(): Promise<SessionReplayState> {
    const native = await Native.getState();
    return fromNativeState(native);
  }

  /**
   * Returns the current recording mask, or `null` if none is set.
   */
  async getRecordingMask(): Promise<RecordingMask | null> {
    const native = await Native.getRecordingMask();
    return fromNativeRecordingMask(native);
  }

  /**
   * Sets or clears the recording mask.
   *
   * Pass `null` to remove any previously set mask.
   *
   * @param mask - The recording mask to apply, or `null` to clear.
   */
  setRecordingMask(mask: RecordingMask | null): Promise<void> {
    return Native.setRecordingMask(toNativeRecordingMask(mask));
  }

  /**
   * Marks the native view behind a React tag as sensitive, or explicitly not
   * sensitive.
   *
   * Prefer the declarative {@link SensitiveView} component; this is the
   * imperative escape hatch for cases where you already hold a tag.
   *
   * @param reactTag - Tag from `findNodeHandle(ref)`.
   * @param isSensitive - `true` masks the view and everything drawn inside it;
   * `false` explicitly un-masks it, overriding any class-level default.
   * @returns `false` when the tag has no native view, which is the case for
   * views React Native collapsed away. Set `collapsable={false}` to prevent
   * that.
   */
  setViewSensitivity(reactTag: number, isSensitive: boolean): Promise<boolean> {
    return Native.setViewSensitivity(reactTag, isSensitive);
  }

  /**
   * Drops the instance-level override set by {@link setViewSensitivity}.
   *
   * Both platforms recycle native views between unrelated components, so an
   * instance flag left behind can reappear under content that was never meant
   * to be masked. Always clear on unmount.
   */
  clearViewSensitivity(reactTag: number): Promise<boolean> {
    return Native.clearViewSensitivity(reactTag);
  }

  /**
   * Applies sensitivity to every current and future instance of a native view
   * class, including its subclasses.
   *
   * Use the {@link NativeViewClass} constants rather than raw class names, so
   * the same call works on both platforms.
   *
   * @example
   * ```typescript
   * // Mask every <Text> in the app.
   * await SplunkSessionReplay.instance.setClassSensitivity(
   *   NativeViewClass.TEXT,
   *   true
   * );
   * ```
   */
  setClassSensitivity(className: string, isSensitive: boolean): Promise<void> {
    return Native.setClassSensitivity(className, isSensitive);
  }

  /**
   * Removes a class-level override, restoring the SDK default for that class.
   */
  clearClassSensitivity(className: string): Promise<void> {
    return Native.clearClassSensitivity(className);
  }

  /**
   * Reads the explicit sensitivity set for a native view class.
   *
   * Returns {@link Sensitivity.UNSET} when no explicit value was set, even if
   * the class is effectively sensitive through inheritance - for example
   * `ReactEditText`, which inherits its default from `android.widget.EditText`.
   */
  async getClassSensitivity(className: string): Promise<Sensitivity> {
    return toSensitivity(await Native.getClassSensitivity(className));
  }

  /**
   * Masks every `<Text>` in the app.
   *
   * Neither platform ships a global "mask all text" switch, so this is
   * implemented as a class-level rule over the native class backing `<Text>`.
   * Note that `<TextInput>` is already masked by default and is unaffected.
   */
  maskAllText(isMasked: boolean = true): Promise<void> {
    return this.setClassSensitivity(NativeViewClass.TEXT, isMasked);
  }

  /**
   * Masks every `<Image>` in the app. Images are not masked by default on
   * either platform.
   */
  maskAllImages(isMasked: boolean = true): Promise<void> {
    return this.setClassSensitivity(NativeViewClass.IMAGE, isMasked);
  }

  /**
   * Masks web view content.
   *
   * Both underlying session replay SDKs mark web views sensitive by default,
   * but the Splunk agents clear that default during install. This restores it.
   */
  maskWebViews(isMasked: boolean = true): Promise<void> {
    return this.setClassSensitivity(NativeViewClass.WEB_VIEW, isMasked);
  }

  /**
   * Sets the preferred capture mode.
   *
   * Worth being deliberate about: recording masks are only applied in
   * {@link RenderingMode.NATIVE}. Switching to
   * {@link RenderingMode.WIREFRAME_ONLY} silently drops them, though per-view
   * and per-class sensitivity still suppress text content.
   *
   * Read the effective mode back from {@link getState}.
   */
  setRenderingMode(mode: RenderingMode): Promise<void> {
    return Native.setRenderingMode(mode);
  }
}
