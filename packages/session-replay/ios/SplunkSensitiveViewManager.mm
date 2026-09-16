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

// Old architecture counterpart to SplunkSensitiveViewComponentView. Extends
// RCTViewManager so the inherited RCTView props keep working, and adds only the
// sensitivity flag.
#ifndef RCT_NEW_ARCH_ENABLED

// RCTBridgeModule must precede the generated Swift header, which declares
// promise-block parameters without importing their typedefs.
#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>

#if __has_include("SplunkSessionReplay-Swift.h")
#import "SplunkSessionReplay-Swift.h"
#else
#import <SplunkSessionReplay/SplunkSessionReplay-Swift.h>
#endif

@interface SplunkSensitiveViewManager : RCTViewManager
@end

@implementation SplunkSensitiveViewManager

RCT_EXPORT_MODULE(SplunkSensitiveView)

RCT_CUSTOM_VIEW_PROPERTY(sensitive, NSNumber, RCTView)
{
  NSNumber *value = json ? [RCTConvert NSNumber:json] : @YES;
  [SplunkSessionReplayImplementation applySensitivityFor:view isSensitive:value];
}

@end

#endif
