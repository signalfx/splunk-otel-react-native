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
import OpenTelemetryApi

/// Handles all global attributes operations.
@objcMembers
@objc(GlobalAttributesHandler)
public class GlobalAttributesHandler: NSObject {

  // MARK: - Setters

  public func setString(_ key: NSString,
                        value: NSString?,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    if let v = value as String? {
      SplunkRum.shared.globalAttributes.setString(v, for: key as String)
    } else {
      _ = SplunkRum.shared.globalAttributes.remove(for: key as String)
    }

    resolve(nil)
  }

  public func setBoolean(_ key: NSString,
                         value: NSNumber?,
                         resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    if let v = value?.boolValue {
      SplunkRum.shared.globalAttributes.setBool(v, for: key as String)
    } else {
      _ = SplunkRum.shared.globalAttributes.remove(for: key as String)
    }

    resolve(nil)
  }

  public func setNumber(_ key: NSString,
                        value: NSNumber?,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    if let v = value {
      SplunkRum.shared.globalAttributes.setDouble(v.doubleValue, for: key as String)
    } else {
      _ = SplunkRum.shared.globalAttributes.remove(for: key as String)
    }

    resolve(nil)
  }

  public func setArray(_ key: NSString,
                       value: NSArray?,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    if let arr = value as? [Any] {
      let mapped = AttributeConverter.convertArrayToAttributeArray(arr)
      SplunkRum.shared.globalAttributes.setArray(AttributeArray(values: mapped), for: key as String)
    } else {
      _ = SplunkRum.shared.globalAttributes.remove(for: key as String)
    }

    resolve(nil)
  }

  // MARK: - Getters

  public func getValue(_ key: NSString,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    let v = SplunkRum.shared.globalAttributes.getValue(for: key as String)
    resolve(AttributeConverter.attributeValueToAny(v))
  }

  public func getString(_ key: NSString,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    resolve(SplunkRum.shared.globalAttributes.getString(for: key as String))
  }

  public func getBoolean(_ key: NSString,
                         resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    resolve(SplunkRum.shared.globalAttributes.getBool(for: key as String))
  }

  public func getNumber(_ key: NSString,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    if let d = SplunkRum.shared.globalAttributes.getDouble(for: key as String) {
      resolve(NSNumber(value: d))
    } else if let i = SplunkRum.shared.globalAttributes.getInt(for: key as String) {
      resolve(NSNumber(value: i))
    } else {
      resolve(nil)
    }
  }

  public func getArray(_ key: NSString,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    if let arr = SplunkRum.shared.globalAttributes.getArray(for: key as String) {
      resolve(arr.values.map { AttributeConverter.attributeValueToAny($0) as Any })
    } else {
      resolve(nil)
    }
  }

  // MARK: - Bulk Operations

  public func setAll(_ map: NSDictionary,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    let attrs = AttributeConverter.buildAttributes(from: map)
    let count = SplunkRum.shared.globalAttributes.addDictionary(attrs.getAll())

    resolve(NSNumber(value: count))
  }

  public func setAllInNameSpace(_ nameSpace: NSString,
                                map: NSDictionary,
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    let attrs = AttributeConverter.buildAttributes(from: map)
    let count = SplunkRum.shared.globalAttributes.addDictionary(attrs.getAll(), intoNamespace: nameSpace as String)

    resolve(NSNumber(value: count))
  }

  public func remove(_ key: NSString,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    let removed = SplunkRum.shared.globalAttributes.remove(for: key as String)

    resolve(AttributeConverter.attributeValueToAny(removed))
  }

  public func removeAll(_ resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    SplunkRum.shared.globalAttributes.removeAll()
    resolve(nil)
  }

  public func contains(_ key: NSString,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    resolve(NSNumber(value: SplunkRum.shared.globalAttributes.contains(key: key as String)))
  }

  public func getAll(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    resolve(SplunkRum.shared.globalAttributes.all)
  }

  public func keys(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    resolve(SplunkRum.shared.globalAttributes.getAllKeys())
  }

  public func values(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    let vals = SplunkRum.shared.globalAttributes.getAllValues().map { AttributeConverter.attributeValueToAny($0) as Any }
    resolve(vals)
  }

  public func size(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    resolve(NSNumber(value: SplunkRum.shared.globalAttributes.count()))
  }
}
