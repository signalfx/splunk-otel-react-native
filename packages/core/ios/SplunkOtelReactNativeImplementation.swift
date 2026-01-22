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

import Foundation
import React
import SplunkAgent

@objcMembers
@objc(SplunkOtelReactNativeImplementation)
public class SplunkOtelReactNativeImplementation: NSObject {

  private let globalAttributesHandler = GlobalAttributesHandler()
  private let customTrackingHandler = CustomTrackingHandler()
  private let userSessionHandler = UserSessionHandler()
  private let webViewHandler = WebViewHandler(bridge: nil)
  private let navigationHandler = NavigationHandler()

  /// Sets the React Native bridge for handlers that require it.
  @objc
  public func setBridge(_ bridge: RCTBridge?) {
    webViewHandler.setBridge(bridge)
  }

  // MARK: - Installation

  @objc
  public func installWithConfiguration(_ configuration: NSDictionary,
                                       modules: NSArray,
                                       resolve: RCTPromiseResolveBlock,
                                       reject: RCTPromiseRejectBlock) {
    do {
      let agentConfig = try AgentConfigurationBuilder.build(from: configuration)
      let moduleConfigs = ModuleConfigurationBuilder.build(from: modules)

      _ = try SplunkRum.install(with: agentConfig, moduleConfigurations: moduleConfigs)

      // We are tracking app start manually since install() is called after didBecomeActive in RN
      AppStartHandler.shared.trackAppStart()

      resolve(nil)
    } catch {
      reject("install_error", "\(error)", error)
    }
  }

  // MARK: - State / Session / User

  @objc
  public func getStateWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                  reject: @escaping RCTPromiseRejectBlock) {
    userSessionHandler.getState(resolve, reject: reject)
  }

  @objc
  public func getSessionStateWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                         reject: @escaping RCTPromiseRejectBlock) {
    userSessionHandler.getSessionState(resolve, reject: reject)
  }

  @objc
  public func getUserStateWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                      reject: @escaping RCTPromiseRejectBlock) {
    userSessionHandler.getUserState(resolve, reject: reject)
  }

  @objc
  public func setUserTrackingModeWithMode(_ mode: NSString?,
                                          resolve: @escaping RCTPromiseResolveBlock,
                                          reject: @escaping RCTPromiseRejectBlock) {
    userSessionHandler.setUserTrackingMode(mode, resolve: resolve, reject: reject)
  }

  // MARK: - Global Attributes setters

  @objc
  public func globalAttributesSetStringWithKey(_ key: NSString,
                                               value: NSString?,
                                               resolve: @escaping RCTPromiseResolveBlock,
                                               reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.setString(key, value: value, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesSetBooleanWithKey(_ key: NSString,
                                                value: NSNumber?,
                                                resolve: @escaping RCTPromiseResolveBlock,
                                                reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.setBoolean(key, value: value, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesSetNumberWithKey(_ key: NSString,
                                               value: NSNumber?,
                                               resolve: @escaping RCTPromiseResolveBlock,
                                               reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.setNumber(key, value: value, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesSetArrayWithKey(_ key: NSString,
                                              value: NSArray?,
                                              resolve: @escaping RCTPromiseResolveBlock,
                                              reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.setArray(key, value: value, resolve: resolve, reject: reject)
  }

  // MARK: - Global Attributes getters

  @objc
  public func globalAttributesGetValueWithKey(_ key: NSString,
                                              resolve: @escaping RCTPromiseResolveBlock,
                                              reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.getValue(key, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesGetStringWithKey(_ key: NSString,
                                               resolve: @escaping RCTPromiseResolveBlock,
                                               reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.getString(key, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesGetBooleanWithKey(_ key: NSString,
                                                resolve: @escaping RCTPromiseResolveBlock,
                                                reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.getBoolean(key, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesGetNumberWithKey(_ key: NSString,
                                               resolve: @escaping RCTPromiseResolveBlock,
                                               reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.getNumber(key, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesGetArrayWithKey(_ key: NSString,
                                              resolve: @escaping RCTPromiseResolveBlock,
                                              reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.getArray(key, resolve: resolve, reject: reject)
  }

  // MARK: - Global Attributes bulk & utils

  @objc
  public func globalAttributesSetAllWithMap(_ map: NSDictionary,
                                            resolve: @escaping RCTPromiseResolveBlock,
                                            reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.setAll(map, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesSetAllInNameSpaceWithNameSpace(_ nameSpace: NSString,
                                                             map: NSDictionary,
                                                             resolve: @escaping RCTPromiseResolveBlock,
                                                             reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.setAllInNameSpace(nameSpace, map: map, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesRemoveWithKey(_ key: NSString,
                                            resolve: @escaping RCTPromiseResolveBlock,
                                            reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.remove(key, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesRemoveAllWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                                   reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.removeAll(resolve, reject: reject)
  }

  @objc
  public func globalAttributesContainsWithKey(_ key: NSString,
                                              resolve: @escaping RCTPromiseResolveBlock,
                                              reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.contains(key, resolve: resolve, reject: reject)
  }

  @objc
  public func globalAttributesGetAllWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                                reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.getAll(resolve, reject: reject)
  }

  @objc
  public func globalAttributesKeysWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                              reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.keys(resolve, reject: reject)
  }

  @objc
  public func globalAttributesValuesWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                                reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.values(resolve, reject: reject)
  }

  @objc
  public func globalAttributesSizeWithResolve(_ resolve: @escaping RCTPromiseResolveBlock,
                                              reject: @escaping RCTPromiseRejectBlock) {
    globalAttributesHandler.size(resolve, reject: reject)
  }

  // MARK: - Custom Tracking

  @objc
  public func customTrackEventWithName(_ name: NSString,
                                       attributes: NSDictionary,
                                       resolve: @escaping RCTPromiseResolveBlock,
                                       reject: @escaping RCTPromiseRejectBlock) {
    customTrackingHandler.trackEvent(name, attributes: attributes, resolve: resolve, reject: reject)
  }

  @objc
  public func customStartWorkflowWithName(_ name: NSString,
                                          resolve: @escaping RCTPromiseResolveBlock,
                                          reject: @escaping RCTPromiseRejectBlock) {
    customTrackingHandler.startWorkflow(name, resolve: resolve, reject: reject)
  }

  @objc
  public func customEndWorkflowWithHandle(_ handle: NSNumber,
                                          resolve: @escaping RCTPromiseResolveBlock,
                                          reject: @escaping RCTPromiseRejectBlock) {
    customTrackingHandler.endWorkflow(handle, resolve: resolve, reject: reject)
  }

  // MARK: - WebView Integration

  @objc
  public func integrateWebViewWithBrowserRumWithViewTag(_ viewTag: NSNumber,
                                                        resolve: @escaping RCTPromiseResolveBlock,
                                                        reject: @escaping RCTPromiseRejectBlock) {
    webViewHandler.integrateWithBrowserRum(viewTag, resolve: resolve, reject: reject)
  }

  // MARK: - Navigation

  @objc
  public func navigationTrackWithScreenName(_ screenName: NSString,
                                             resolve: @escaping RCTPromiseResolveBlock,
                                             reject: @escaping RCTPromiseRejectBlock) {
    navigationHandler.track(screenName, resolve: resolve, reject: reject)
  }
}
