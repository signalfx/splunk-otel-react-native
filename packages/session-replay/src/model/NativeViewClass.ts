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

import { Platform } from 'react-native';

const forPlatform = (android: string, ios: string): string =>
  Platform.OS === 'android' ? android : ios;

/**
 * Native view classes that back the common React Native primitives.
 *
 * Session replay sensitivity is decided by the native SDKs against the native
 * view hierarchy, which knows nothing about React components. These constants
 * are the translation layer, so callers can write
 * `setClassSensitivity(NativeViewClass.TEXT, true)` instead of hardcoding
 * `com.facebook.react.views.text.ReactTextView` / `RCTParagraphComponentView`.
 *
 * Because sensitivity resolution walks the superclass chain, marking a class
 * here also covers its subclasses.
 */
export const NativeViewClass = {
  /**
   * `<Text>`. Not sensitive by default on either platform.
   *
   * On Android this is a `TextView` subclass, so its string content is
   * extracted into the wireframe. On iOS it is a plain `UIView` that draws
   * text through Core Text, so it is captured as pixels rather than text.
   */
  TEXT: forPlatform(
    'com.facebook.react.views.text.ReactTextView',
    'RCTParagraphComponentView'
  ),

  /**
   * `<TextInput>`. Sensitive by default on both platforms - on Android via
   * `android.widget.EditText` and on iOS via the backing `UITextField` /
   * `UITextView`.
   *
   * On iOS this constant refers to the outer Fabric component view, which is
   * *not* the view carrying the default. Marking it is still useful to cover
   * the padding around the text, but it is not what produces the default mask.
   */
  TEXT_INPUT: forPlatform(
    'com.facebook.react.views.textinput.ReactEditText',
    'RCTTextInputComponentView'
  ),

  /** `<Image>`. Not sensitive by default on either platform. */
  IMAGE: forPlatform(
    'com.facebook.react.views.image.ReactImageView',
    'RCTImageComponentView'
  ),

  /**
   * `<View>` - the base class of nearly every React Native host view.
   *
   * Marking this sensitive masks essentially the whole app, which makes it a
   * good "deny by default" demonstration but a poor production setting.
   */
  VIEW: forPlatform(
    'com.facebook.react.views.view.ReactViewGroup',
    'RCTViewComponentView'
  ),

  /** `<ScrollView>` / `<FlatList>` viewport. */
  SCROLL_VIEW: forPlatform(
    'com.facebook.react.views.scroll.ReactScrollView',
    'RCTScrollViewComponentView'
  ),

  /** `<Switch>`. */
  SWITCH: forPlatform(
    'com.facebook.react.views.switchview.ReactSwitch',
    'RCTSwitchComponentView'
  ),

  /**
   * `react-native-webview`.
   *
   * The underlying session replay SDKs treat web views as sensitive by
   * default, but both Splunk agents deliberately clear that default at
   * install time, so web content is visible unless it is masked explicitly.
   */
  WEB_VIEW: forPlatform('android.webkit.WebView', 'WKWebView'),
} as const;

export type NativeViewClassName =
  (typeof NativeViewClass)[keyof typeof NativeViewClass];
