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
import OpenTelemetryApi
import SplunkAgent

/// Converts between NSDictionary and MutableAttributes/AttributeValue.
enum AttributeConverter {

  static func buildAttributes(from nsDict: NSDictionary) -> MutableAttributes {
    return MutableAttributes(dictionary: buildSpanAttributes(from: nsDict))
  }

  /// Converts a bridged dictionary into typed attribute values for use on a span.
  ///
  /// A span takes `[String: AttributeValue]` directly rather than the
  /// `MutableAttributes` that `buildAttributes(from:)` produces.
  static func buildSpanAttributes(from nsDict: NSDictionary) -> [String: AttributeValue] {
    var dict: [String: AttributeValue] = [:]
    for (kAny, vAny) in nsDict {
      guard let key = kAny as? String else { continue }

      if let s = vAny as? String {
        dict[key] = .string(s)
        continue
      }

      if let n = vAny as? NSNumber {
        dict[key] = attributeValue(from: n)
        continue
      }

      if let arr = vAny as? [Any] {
        dict[key] = .array(AttributeArray(values: convertArrayToAttributeArray(arr)))
        continue
      }
    }

    return dict
  }

  /// Maps an `NSNumber` to a boolean, integer, or double attribute value.
  ///
  /// JavaScript booleans bridge to `__NSCFBoolean`, which also casts
  /// successfully to a number, so the boolean check has to come first. A Swift
  /// `as? Bool` cast is not used because it also succeeds for the numbers 0 and 1.
  ///
  /// Every JavaScript number arrives as a double, so whole numbers are mapped to
  /// integers to match the Android converter.
  private static func attributeValue(from number: NSNumber) -> AttributeValue {
    if CFGetTypeID(number) == CFBooleanGetTypeID() {
      return .bool(number.boolValue)
    }

    if !CFNumberIsFloatType(number) {
      return .int(number.intValue)
    }

    if let integer = Int(exactly: number.doubleValue) {
      return .int(integer)
    }

    return .double(number.doubleValue)
  }

  static func attributeValueToAny(_ value: AttributeValue?) -> Any? {
    guard let value else { return nil }

    switch value {
    case let .string(v): return v
    case let .bool(v): return v
    case let .int(v): return v
    case let .double(v): return v
    case let .array(arr): return arr.values.map { attributeValueToAny($0) as Any }
    case let .set(set): return set.labels.mapValues { attributeValueToAny($0) as Any }
    case let .stringArray(v): return v
    case let .boolArray(v): return v
    case let .intArray(v): return v
    case let .doubleArray(v): return v
    }
  }

  static func convertArrayToAttributeArray(_ arr: [Any]) -> [AttributeValue] {
    return arr.compactMap { element in
      if let s = element as? String { return .string(s) }
      if let n = element as? NSNumber { return attributeValue(from: n) }

      return nil
    }
  }
}
