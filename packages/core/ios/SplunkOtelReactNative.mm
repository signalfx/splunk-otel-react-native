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

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <React/RCTConvert.h>

#if __has_include("SplunkOtelReactNative-Swift.h")
#import "SplunkOtelReactNative-Swift.h"
#else
#import <SplunkOtelReactNative/SplunkOtelReactNative-Swift.h>
#endif

#import "SplunkOtelReactNative.h"

@interface SplunkOtelReactNative ()
@property(nonatomic, strong) SplunkOtelReactNativeImplementation *impl;
@end

// Initialize AppStartHandler as early as possible to capture lifecycle notifications.
// Using __attribute__((constructor)) instead of +load because RCT_EXPORT_MODULE
// already defines a +load method.
__attribute__((constructor))
static void initializeAppStartHandler(void) {
  [AppStartHandler setUp];
}

@implementation SplunkOtelReactNative

#ifndef RCT_NEW_ARCH_ENABLED
@synthesize bridge = _bridge;
#endif

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [SplunkOtelReactNativeImplementation new];
  }
  return self;
}

#ifndef RCT_NEW_ARCH_ENABLED
- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  [self.impl setBridge:bridge];
}
#endif

#ifndef RCT_NEW_ARCH_ENABLED
RCT_EXPORT_MODULE(SplunkOtelReactNative)
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSplunkOtelReactNativeSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"SplunkOtelReactNative";
}
#endif

#pragma mark - Installation

#ifndef RCT_NEW_ARCH_ENABLED
RCT_EXPORT_METHOD(install:(NSDictionary *)configuration
                  modules:(NSArray *)modules
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self installWithConfiguration:configuration modules:modules resolve:resolve reject:reject];
}
#endif

- (void)installWithConfiguration:(NSDictionary *)configuration
        modules:(NSArray *)modules
       resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
  if (configuration == nil || ![configuration isKindOfClass:[NSDictionary class]]) {
    reject(@"invalid_args", @"install: configuration is nil or not an object", nil);
    return;
  }
  
  NSArray *safeModules = modules;
  if (safeModules == nil || ![safeModules isKindOfClass:[NSArray class]]) {
    safeModules = @[];
  }
  
  [self.impl installWithConfiguration:(NSDictionary *)configuration modules:safeModules resolve:resolve reject:reject];
}

// Alias to satisfy callers expecting selector: install:modules:resolve:reject:
- (void)install:(NSDictionary *)configuration
        modules:(NSArray *)modules
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [self installWithConfiguration:configuration modules:modules resolve:resolve reject:reject];
}

#pragma mark - Preferences

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(getEndpointConfiguration,
                 getEndpointConfigurationWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getEndpointConfiguration:resolve reject:reject];
}
#endif

- (void)getEndpointConfiguration:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject
{
  [self.impl getEndpointConfiguration:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(setEndpointConfiguration,
                 setEndpointConfigurationEndpoint:(nullable NSDictionary *)endpoint
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self setEndpointConfiguration:endpoint resolve:resolve reject:reject];
}
#endif

- (void)setEndpointConfiguration:(nullable NSDictionary *)endpoint
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject
{
  [self.impl setEndpointConfiguration:endpoint resolve:resolve reject:reject];
}

#pragma mark - State / Session / User

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

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(getSessionState,
                 getSessionStateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getSessionState:resolve reject:reject];
}
#endif

- (void)getSessionState:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [self.impl getSessionStateWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(getUserState,
                 getUserStateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getUserState:resolve reject:reject];
}
#endif

- (void)getUserState:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [self.impl getUserStateWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(setUserTrackingMode,
                 setUserTrackingModeWithMode:(nullable NSString *)mode
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self setUserTrackingMode:mode resolve:resolve reject:reject];
}
#endif

- (void)setUserTrackingMode:(nullable NSString *)mode
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
{
  [self.impl setUserTrackingModeWithMode:mode resolve:resolve reject:reject];
}

#pragma mark - Global Attributes setters

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSetString,
                 globalAttributesSetStringKey:(NSString *)key
                 value:(nullable NSString *)value
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSetString:key value:value resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesSetString:(NSString *)key
                            value:(nullable NSString *)value
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSetStringWithKey:key value:value resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSetBoolean,
                 globalAttributesSetBooleanKey:(nonnull NSString *)key
                 value:(nonnull NSNumber *)value
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSetBoolean:key value:value resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesSetBoolean:(NSString *)key
                             value:(NSNumber *)value
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSetBooleanWithKey:key value:value resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSetNumber,
                 globalAttributesSetNumberKey:(nonnull NSString *)key
                 value:(nonnull NSNumber *)value
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSetNumber:key value:value resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesSetNumber:(NSString *)key
                            value:(NSNumber *)value
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSetNumberWithKey:key value:value resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSetArray,
                 globalAttributesSetArrayKey:(NSString *)key
                 value:(nullable NSArray *)value
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSetArray:key value:value resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesSetArray:(NSString *)key
                           value:(nullable NSArray *)value
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSetArrayWithKey:key value:value resolve:resolve reject:reject];
}

#pragma mark - Global Attributes getters and utils

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesGetValue,
                 globalAttributesGetValueKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesGetValue:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesGetValue:(NSString *)key
                        resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesGetValueWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesGetString,
                 globalAttributesGetStringKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesGetString:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesGetString:(NSString *)key
                         resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesGetStringWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesGetBoolean,
                 globalAttributesGetBooleanKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesGetBoolean:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesGetBoolean:(NSString *)key
                          resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesGetBooleanWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesGetNumber,
                 globalAttributesGetNumberKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesGetNumber:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesGetNumber:(NSString *)key
                         resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesGetNumberWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesGetArray,
                 globalAttributesGetArrayKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesGetArray:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesGetArray:(NSString *)key
                        resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesGetArrayWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSetAll,
                 globalAttributesSetAllMap:(NSDictionary *)map
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSetAll:map resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesSetAll:(NSDictionary *)map
                      resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSetAllWithMap:map resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSetAllInNameSpace,
                 globalAttributesSetAllInNameSpaceNamespace:(NSString *)namespace_
                 map:(NSDictionary *)map
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSetAllInNameSpace:namespace_ map:map resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesSetAllInNameSpace:(NSString *)namespace_
                                     map:(NSDictionary *)map
                                 resolve:(RCTPromiseResolveBlock)resolve
                                 reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSetAllInNameSpaceWithNameSpace:namespace_ map:map resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesRemove,
                 globalAttributesRemoveKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesRemove:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesRemove:(NSString *)key
                      resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesRemoveWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesRemoveAll,
                 globalAttributesRemoveAllWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesRemoveAll:resolve reject:reject];
}
#endif

- (void)globalAttributesRemoveAll:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesRemoveAllWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesContains,
                 globalAttributesContainsKey:(NSString *)key
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesContains:key resolve:resolve reject:reject];
}
#endif

- (void)globalAttributesContains:(NSString *)key
                        resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesContainsWithKey:key resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesGetAll,
                 globalAttributesGetAllWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesGetAll:resolve reject:reject];
}
#endif

- (void)globalAttributesGetAll:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesGetAllWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesKeys,
                 globalAttributesKeysWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesKeys:resolve reject:reject];
}
#endif

- (void)globalAttributesKeys:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesKeysWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesValues,
                 globalAttributesValuesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesValues:resolve reject:reject];
}
#endif

- (void)globalAttributesValues:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesValuesWithResolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(globalAttributesSize,
                 globalAttributesSizeWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self globalAttributesSize:resolve reject:reject];
}
#endif

- (void)globalAttributesSize:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  [self.impl globalAttributesSizeWithResolve:resolve reject:reject];
}

#pragma mark - Custom Tracking

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(customTrackEvent,
                 customTrackEventName:(NSString *)name
                 attributes:(NSDictionary *)attributes
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self customTrackEvent:name attributes:attributes resolve:resolve reject:reject];
}
#endif

- (void)customTrackEvent:(NSString *)name
              attributes:(NSDictionary *)attributes
                resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [self.impl customTrackEventWithName:name attributes:attributes resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(customStartWorkflow,
                 customStartWorkflowName:(NSString *)name
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self customStartWorkflow:name resolve:resolve reject:reject];
}
#endif

- (void)customStartWorkflow:(NSString *)name
                   resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [self.impl customStartWorkflowWithName:name resolve:resolve reject:reject];
}

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(customEndWorkflow,
                 customEndWorkflowHandle:(nonnull NSNumber *)handle
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self customEndWorkflow:[handle doubleValue] resolve:resolve reject:reject];
}
#endif

// New architecture receives `double` from codegen, old arch receives NSNumber
- (void)customEndWorkflow:(double)handle
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  NSNumber *handleNumber = [NSNumber numberWithDouble:handle];
  [self.impl customEndWorkflowWithHandle:handleNumber resolve:resolve reject:reject];
}

#pragma mark - Navigation

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(navigationTrack,
                 navigationTrackScreenName:(NSString *)screenName
                 attributes:(NSDictionary *)attributes
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self navigationTrack:screenName attributes:attributes resolve:resolve reject:reject];
}
#endif

- (void)navigationTrack:(NSString *)screenName
             attributes:(NSDictionary *)attributes
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [self.impl navigationTrackWithScreenName:screenName attributes:attributes resolve:resolve reject:reject];
}

#pragma mark - WebView Integration

#ifndef RCT_NEW_ARCH_ENABLED
RCT_REMAP_METHOD(integrateWebViewWithBrowserRum,
                 integrateWebViewWithBrowserRumViewTag:(nonnull NSNumber *)viewTag
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self integrateWebViewWithBrowserRum:[viewTag doubleValue] resolve:resolve reject:reject];
}
#endif

// New architecture receives `double` from codegen, old arch receives NSNumber
- (void)integrateWebViewWithBrowserRum:(double)viewTag
                               resolve:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject
{
  NSNumber *tag = @((int)viewTag);
  [self.impl integrateWebViewWithBrowserRumWithViewTag:tag resolve:resolve reject:reject];
}

@end
