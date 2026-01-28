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
import WebKit
import SplunkAgent

/// Handles WebView integration with Browser RUM.
@objcMembers
class WebViewHandler: NSObject {

  private weak var bridge: RCTBridge?

  init(bridge: RCTBridge?) {
    self.bridge = bridge
    super.init()
  }

  func setBridge(_ bridge: RCTBridge?) {
    self.bridge = bridge
  }

  func integrateWithBrowserRum(
    _ viewTag: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let bridge = self.bridge else {
      reject("E_WEBVIEW", "Bridge not available", nil)
      return
    }

    DispatchQueue.main.async {
      guard let uiManager = bridge.module(forName: "UIManager") as? RCTUIManager else {
        reject("E_WEBVIEW", "UIManager not available", nil)
        return
      }

      uiManager.addUIBlock { [weak self] _, viewRegistry in
        guard let self = self else {
          reject("E_WEBVIEW", "Handler deallocated", nil)
          return
        }

        guard let viewRegistry = viewRegistry else {
          reject("E_WEBVIEW", "View registry not available", nil)
          return
        }

        guard let view = viewRegistry[viewTag] else {
          reject("E_WEBVIEW", "View not found for tag \(viewTag)", nil)
          return
        }

        if let webView = self.findWKWebView(in: view) {
          SplunkRum.shared.webViewNativeBridge.integrateWithBrowserRum(webView)
          resolve(nil)
        } else {
          reject("E_WEBVIEW", "View is not a WKWebView", nil)
        }
      }
    }
  }

  /// Recursively searches for a WKWebView in the view hierarchy.
  private func findWKWebView(in view: UIView) -> WKWebView? {
    if let webView = view as? WKWebView {
      return webView
    }
    for subview in view.subviews {
      if let found = findWKWebView(in: subview) {
        return found
      }
    }
    return nil
  }
}
