//
// Copyright 2025 Splunk Inc.
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

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <SplunkOtelReactNativeSpec/SplunkOtelReactNativeSpec.h>
#endif

NS_ASSUME_NONNULL_BEGIN

#ifdef RCT_NEW_ARCH_ENABLED
@interface SplunkOtelReactNative : NSObject <NativeSplunkOtelReactNativeSpec>
#else
@interface SplunkOtelReactNative : NSObject <RCTBridgeModule>

// Bridge
@property (nonatomic, weak, nullable) RCTBridge *bridge;

// Installation
- (void)install:(NSDictionary *)configuration
        modules:(NSArray *)modules
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject;

// Preferences
- (void)getEndpointConfiguration:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

- (void)setEndpointConfiguration:(nullable NSDictionary *)endpoint
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

// State
- (void)getState:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)getSessionState:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject;

- (void)getUserState:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

- (void)setUserTrackingMode:(nullable NSString *)mode
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject;

// Global Attributes - Setters
- (void)globalAttributesSetString:(NSString *)key
                            value:(nullable NSString *)value
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesSetBoolean:(NSString *)key
                             value:(NSNumber *)value
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesSetNumber:(NSString *)key
                            value:(NSNumber *)value
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesSetArray:(NSString *)key
                           value:(nullable NSArray *)value
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

// Global Attributes - Getters
- (void)globalAttributesGetValue:(NSString *)key
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesGetString:(NSString *)key
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesGetBoolean:(NSString *)key
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesGetNumber:(NSString *)key
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesGetArray:(NSString *)key
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

// Global Attributes - Bulk operations
- (void)globalAttributesSetAll:(NSDictionary *)map
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesSetAllInNameSpace:(NSString *)nameSpace
                                      map:(NSDictionary *)map
                                  resolve:(RCTPromiseResolveBlock)resolve
                                   reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesRemove:(NSString *)key
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesRemoveAll:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesContains:(NSString *)key
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesGetAll:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesKeys:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesValues:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject;

- (void)globalAttributesSize:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject;

// Custom Tracking
- (void)customTrackEvent:(NSString *)name
              attributes:(NSDictionary *)attributes
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject;

- (void)customStartWorkflow:(NSString *)name
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject;

- (void)customEndWorkflow:(double)handle
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject;

// Navigation
- (void)navigationTrack:(NSString *)screenName
             attributes:(NSDictionary *)attributes
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject;

// WebView Integration
- (void)integrateWebViewWithBrowserRum:(double)viewTag
                               resolve:(RCTPromiseResolveBlock)resolve
                                reject:(RCTPromiseRejectBlock)reject;

#endif

@end

NS_ASSUME_NONNULL_END
