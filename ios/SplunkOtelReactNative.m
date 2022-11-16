#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SplunkOtelReactNative, NSObject)


RCT_EXTERN_METHOD(initialize:(NSDictionary*)config
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(export:(NSArray*)spans
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
