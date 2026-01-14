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

/// Thread-safe storage for workflow spans with handle-based access.
final class WorkflowSpanStore {

  static let shared = WorkflowSpanStore()

  private var nextHandle: Int = 1
  private var spans: [Int: Span] = [:]
  private let lock = NSLock()

  private init() {}

  func allocate(for span: Span) -> Int {
    lock.lock()
    defer { lock.unlock() }

    let handle = nextHandle
    nextHandle &+= 1
    spans[handle] = span

    return handle
  }

  func remove(_ handle: Int) -> Span? {
    lock.lock()
    defer { lock.unlock() }

    return spans.removeValue(forKey: handle)
  }
}
