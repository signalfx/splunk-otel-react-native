//
// Copyright 2026 Splunk Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <React/RCTBridgeModule.h>

#if __has_include("SplunkSessionReplay-Swift.h")
#import "SplunkSessionReplay-Swift.h"
#else
#import <SplunkSessionReplay/SplunkSessionReplay-Swift.h>
#endif

#import "SplunkSessionReplay.h"

@interface SplunkSessionReplay ()
@property(nonatomic, strong) SplunkSessionReplayImplementation *impl;
@end

@implementation SplunkSessionReplay

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [SplunkSessionReplayImplementation new];
  }
  return self;
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_EXPORT_MODULE(SplunkSessionReplay)
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSplunkSessionReplaySpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"SplunkSessionReplay";
}
#endif

#pragma mark - Recording Control

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(start,
                 startWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self start:resolve reject:reject];
}
#endif

- (void)start:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
  [self.impl startWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(stop,
                 stopWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self stop:resolve reject:reject];
}
#endif

- (void)stop:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  [self.impl stopWithResolve:resolve reject:reject];
}

#pragma mark - State

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(getState,
                 getStateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getState:resolve reject:reject];
}
#endif

- (void)getState:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [self.impl getStateWithResolve:resolve reject:reject];
}

#pragma mark - Preferences

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(getPreferences,
                 getPreferencesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getPreferences:resolve reject:reject];
}
#endif

- (void)getPreferences:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [self.impl getPreferencesWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(setPreferences,
                 setPreferencesRenderingMode:(nullable NSString *)renderingMode
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self setPreferences:renderingMode resolve:resolve reject:reject];
}
#endif

- (void)setPreferences:(nullable NSString *)renderingMode
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [self.impl setPreferencesWithRenderingMode:renderingMode resolve:resolve reject:reject];
}

#pragma mark - Recording Mask

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(getRecordingMask,
                 getRecordingMaskWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getRecordingMask:resolve reject:reject];
}
#endif

- (void)getRecordingMask:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  [self.impl getRecordingMaskWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(setRecordingMask,
                 setRecordingMaskMask:(nullable NSDictionary *)mask
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self setRecordingMask:mask resolve:resolve reject:reject];
}
#endif

- (void)setRecordingMask:(nullable NSDictionary *)mask
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  [self.impl setRecordingMaskWithMask:mask resolve:resolve reject:reject];
}

@end
