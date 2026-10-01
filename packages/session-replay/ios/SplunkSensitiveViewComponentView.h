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

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Host view backing the `<SensitiveView>` component.
 *
 * Subclassing RCTViewComponentView means the whole ViewProps surface - borders,
 * radii, background, overflow - is handled by React Native as usual, and this
 * only has to add the sensitivity flag.
 */
@interface SplunkSensitiveViewComponentView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END

#endif
