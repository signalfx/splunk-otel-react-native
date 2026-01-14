/*
 * Copyright 2025 Splunk Inc.
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

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  type ComponentType,
  type ReactElement,
  type RefObject,
} from 'react';
import { SplunkRum } from '../api/SplunkRum';

/**
 * Props for SplunkWebView.
 *
 * Pass WebView props directly alongside the required `WebViewComponent`.
 */
export interface SplunkWebViewProps {
  /**
   * The WebView component to use.
   *
   * Pass the WebView component from `react-native-webview`.
   * This allows the SDK to avoid a direct dependency on react-native-webview.
   *
   * @example
   * ```tsx
   * import { WebView } from 'react-native-webview';
   *
   * <SplunkWebView WebViewComponent={WebView} source={{ uri: '...' }} />
   * ```
   */
  WebViewComponent: ComponentType<any>;

  /**
   * Called when Browser RUM integration is complete.
   *
   * @param success - Whether integration succeeded.
   */
  onBrowserRumIntegrated?: (success: boolean) => void;

  /**
   * Ref to the underlying WebView component.
   *
   * Use this to access WebView methods like `reload()`, `goBack()`, etc.
   */
  webViewRef?: RefObject<any>;

  /**
   * Called when the WebView finishes loading.
   *
   * Your handler is called after Browser RUM integration.
   */
  onLoadEnd?: (event: any) => void;

  /**
   * All other props are forwarded to the underlying WebView.
   */
  [key: string]: any;
}

/**
 * WebView wrapper that automatically integrates with Splunk Browser RUM.
 *
 * This component wraps `react-native-webview` and automatically injects
 * the `window.SplunkRumNative` JavaScript interface when the WebView loads.
 * This enables correlation between native RUM sessions and Browser RUM sessions.
 *
 * @example Basic usage
 * ```tsx
 * import { WebView } from 'react-native-webview';
 * import { SplunkWebView } from '@splunk/otel-react-native';
 *
 * function MyScreen() {
 *   return (
 *     <SplunkWebView
 *       WebViewComponent={WebView}
 *       source={{ uri: 'https://example.com' }}
 *       style={{ flex: 1 }}
 *     />
 *   );
 * }
 * ```
 *
 * @example With integration callback
 * ```tsx
 * <SplunkWebView
 *   WebViewComponent={WebView}
 *   source={{ uri: 'https://example.com' }}
 *   onBrowserRumIntegrated={(success) => {
 *     console.log('Browser RUM integration:', success ? 'success' : 'failed');
 *   }}
 * />
 * ```
 *
 * @example With ref access
 * ```tsx
 * const webViewRef = useRef<WebView>(null);
 *
 * <SplunkWebView
 *   webViewRef={webViewRef}
 *   WebViewComponent={WebView}
 *   source={{ uri: 'https://example.com' }}
 * />
 *
 * // Access WebView methods
 * webViewRef.current?.reload();
 * ```
 */
export function SplunkWebView(props: SplunkWebViewProps): ReactElement {
  const {
    WebViewComponent,
    onBrowserRumIntegrated,
    webViewRef: externalRef,
    onLoadEnd,
    ...restProps
  } = props;

  const internalRef = useRef<any>(null);
  const webViewRef = externalRef ?? internalRef;
  const isIntegrated = useRef(false);

  // Reset integration flag when component remounts, TODO double check with Android re-renders
  useEffect(() => {
    return () => {
      isIntegrated.current = false;
    };
  }, []);

  const handleLoadEnd = useCallback(
    (event: any) => {
      // Integrate with Browser RUM if not already done
      if (!isIntegrated.current) {
        isIntegrated.current = true;

        // Get the native view tag from the WebView ref
        const nativeRef = webViewRef.current?.webViewRef?.current;
        const viewTag = nativeRef?._nativeTag;

        if (viewTag && typeof viewTag === 'number') {
          SplunkRum.instance
            .integrateWebViewWithBrowserRum(viewTag)
            .then(() => {
              onBrowserRumIntegrated?.(true);
            })
            .catch((error) => {
              console.warn(
                '[SplunkWebView] Browser RUM integration failed:',
                error
              );
              onBrowserRumIntegrated?.(false);
            });
        } else {
          console.warn(
            '[SplunkWebView] Could not get native view tag from WebView ref'
          );
          onBrowserRumIntegrated?.(false);
        }
      }

      onLoadEnd?.(event);
    },
    [webViewRef, onLoadEnd, onBrowserRumIntegrated]
  );

  return createElement(WebViewComponent, {
    ...restProps,
    ref: webViewRef,
    onLoadEnd: handleLoadEnd,
  });
}
