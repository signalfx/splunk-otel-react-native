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

#import "SplunkSensitiveViewComponentView.h"

#import <react/renderer/components/SplunkSessionReplaySpec/ComponentDescriptors.h>
#import <react/renderer/components/SplunkSessionReplaySpec/Props.h>
#import <react/renderer/components/SplunkSessionReplaySpec/RCTComponentViewHelpers.h>

// The generated Swift header declares promise-block parameters for the
// TurboModule methods but does not import their typedefs, so React's bridge
// header has to come first.
#import <React/RCTBridgeModule.h>

#if __has_include("SplunkSessionReplay-Swift.h")
#import "SplunkSessionReplay-Swift.h"
#else
#import <SplunkSessionReplay/SplunkSessionReplay-Swift.h>
#endif

using namespace facebook::react;

@implementation SplunkSensitiveViewComponentView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SplunkSensitiveViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SplunkSensitiveViewProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const SplunkSensitiveViewProps>(props);

  // Let React Native apply the standard view props first, then layer the
  // sensitivity flag on the same view.
  [super updateProps:props oldProps:oldProps];

  [SplunkSessionReplayImplementation applySensitivityFor:self isSensitive:@(newProps.sensitive)];
}

- (void)prepareForRecycle
{
  // Release the flag with the view. Fabric reuses component views across
  // unrelated components, so a flag left behind would mask - or, worse for an
  // exemption, un-mask - whatever is mounted next.
  [SplunkSessionReplayImplementation applySensitivityFor:self isSensitive:nil];

  [super prepareForRecycle];
}

@end

#endif
