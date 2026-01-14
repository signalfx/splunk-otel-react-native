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
    var dict: [String: AttributeValue] = [:]
    for (kAny, vAny) in nsDict {
      guard let key = kAny as? String else { continue }

      if let s = vAny as? String {
        dict[key] = .string(s)
        continue
      }

      if let b = vAny as? Bool {
        dict[key] = .bool(b)
        continue
      }

      if let n = vAny as? NSNumber {
        dict[key] = .double(n.doubleValue)
        continue
      }

      if let arr = vAny as? [Any] {
        let mapped: [AttributeValue] = arr.compactMap { e in
          if let s = e as? String { return .string(s) }
          if let b = e as? Bool { return .bool(b) }
          if let n = e as? NSNumber { return .double(n.doubleValue) }
          return nil
        }

        dict[key] = .array(AttributeArray(values: mapped))
        continue
      }
    }

    return MutableAttributes(dictionary: dict)
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
      if let b = element as? Bool { return .bool(b) }
      if let n = element as? NSNumber {

        // TODO: reconsider this helper hack after settling on new arch types
        if CFNumberIsFloatType(n) {
          return .double(n.doubleValue)
        } else {
          return .int(n.intValue)
        }
      }

      return nil
    }
  }
}
