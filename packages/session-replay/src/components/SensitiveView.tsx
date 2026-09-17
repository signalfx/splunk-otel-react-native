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

import React from 'react';
import type { ViewProps } from 'react-native';

import SplunkSensitiveViewNative from '../specs/SplunkSensitiveViewNativeComponent';

export interface SensitiveViewProps extends ViewProps {
  /**
   * Whether this view is masked in session replay recordings.
   *
   * Masking and un-masking are not symmetric, which is worth understanding
   * before relying on either.
   *
   * `true` covers the whole subtree, because a mask is a rectangle over this
   * view's frame and everything drawn inside it is behind that rectangle.
   *
   * `false` applies to **this view only**. It does not un-mask descendants and
   * it does not punch a hole through an enclosing `<SensitiveView>`.
   * Sensitivity is resolved per view - own instance flag, then own class, then
   * superclasses - and no ancestor is ever consulted. To exempt a specific
   * element from a class-level rule, set the flag on that element with
   * {@link SplunkSessionReplay.setViewSensitivity | setViewSensitivity} and its
   * own ref. To carve a readable region out of a masked area, use an erasing
   * {@link RecordingMask} element.
   *
   * @defaultValue true
   */
  sensitive?: boolean;
}

/**
 * Masks everything rendered inside it in session replay recordings.
 *
 * The native session replay SDKs decide sensitivity against the *native* view
 * tree, which has no concept of React components. This component bridges the
 * two: it is a native host view that carries the sensitivity flag, so the whole
 * subtree is covered by the masking pattern without any of the children needing
 * to know about session replay.
 *
 * Being a real host component rather than a marked-up `<View>` is what makes it
 * safe. The flag is applied when the native view is created and released when
 * the view is recycled, so there is no React tag to resolve, nothing to clear
 * on unmount, and no way for a reused view to carry the flag into unrelated
 * content.
 *
 * Masking is applied on device. The pixels behind the mask are never encoded
 * into the recording, so sensitive content does not reach the network or the
 * Splunk Observability Cloud backend.
 *
 * @example
 * ```tsx
 * <SensitiveView>
 *   <Text>{account.iban}</Text>
 *   <Image source={{ uri: customer.photoUrl }} />
 * </SensitiveView>
 * ```
 *
 * @example Exempt one element from an app-wide rule. The flag has to sit on
 * the element itself, so this needs a ref rather than a wrapper.
 * ```tsx
 * await SplunkSessionReplay.instance.maskAllImages();
 *
 * const ref = useRef<HostInstance>(null);
 * <Image ref={ref} source={brandLogo} />;
 *
 * const tag = findNodeHandle(ref.current as never);
 * if (tag != null) {
 *   await SplunkSessionReplay.instance.setViewSensitivity(tag, false);
 * }
 * ```
 */
export const SensitiveView: React.FC<SensitiveViewProps> = ({
  sensitive = true,
  children,
  ...viewProps
}) => (
  <SplunkSensitiveViewNative {...viewProps} sensitive={sensitive}>
    {children}
  </SplunkSensitiveViewNative>
);
