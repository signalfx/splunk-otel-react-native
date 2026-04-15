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

import Foundation
import SplunkAgent

enum SessionReplaySerializer {

  // MARK: - State

  static func serializeState(_ state: any SessionReplayModuleState) -> [String: Any] {
    return [
      "status": serializeStatus(state.status),
      "isRecording": state.isRecording,
      "samplingRate": state.samplingRate
    ]
  }

  // MARK: - Status

  static func serializeStatus(_ status: SessionReplayStatus) -> String {
    switch status {
    case .recording:
      return "recording"
    case .notRecording(let cause):
      switch cause {
      case .notStarted: return "notStarted"
      case .stopped: return "stopped"
      case .internalError: return "internalError"
      case .swiftUIPreviewContext: return "swiftUIPreviewContext"
      case .unsupportedPlatform: return "unsupportedPlatform"
      case .storageLimitReached: return "storageLimitReached"
      case .disabledBySampling: return "disabledBySampling"
      }
    }
  }

  // MARK: - Recording Mask

  static func serializeRecordingMask(_ mask: RecordingMask) -> [String: Any] {
    return [
      "elements": mask.elements.map { serializeMaskElement($0) }
    ]
  }

  static func serializeMaskElement(_ element: MaskElement) -> [String: Any] {
    return [
      "x": element.rect.origin.x,
      "y": element.rect.origin.y,
      "width": element.rect.size.width,
      "height": element.rect.size.height,
      "type": element.type == .covering ? "covering" : "erasing"
    ]
  }

  static func deserializeRecordingMask(_ dict: NSDictionary) -> RecordingMask? {
    guard let elementsArray = dict["elements"] as? [[String: Any]] else { return nil }

    let elements: [MaskElement] = elementsArray.compactMap { item in
      guard let x = item["x"] as? CGFloat,
            let y = item["y"] as? CGFloat,
            let width = item["width"] as? CGFloat,
            let height = item["height"] as? CGFloat else {
        return nil
      }

      let typeStr = item["type"] as? String ?? "covering"
      let maskType: MaskElement.MaskType = typeStr == "erasing" ? .erasing : .covering

      return MaskElement(rect: CGRect(x: x, y: y, width: width, height: height), type: maskType)
    }

    return RecordingMask(elements: elements)
  }
}
