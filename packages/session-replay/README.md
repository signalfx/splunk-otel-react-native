# Splunk Session Replay for React Native

[![npm version](https://badge.fury.io/js/@splunk%2Fotel-session-replay-react-native.svg)](https://badge.fury.io/js/@splunk%2Fotel-session-replay-react-native)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Session Replay add-on for the [Splunk Distribution of OpenTelemetry for React Native](https://github.com/signalfx/splunk-otel-react-native). Captures visual replays of user sessions on Android and iOS.

## Documentation

- [Install the Splunk RUM React Native Agent](https://help.splunk.com/en/splunk-observability-cloud/manage-data/available-data-sources/supported-integrations-in-splunk-observability-cloud/rum-instrumentation/instrument-mobile-and-web-applications-for-splunk-real-user-monitoring-rum/instrument-react-native-agent-applications-for-splunk-rum/install-the-splunk-rum-react-native-agent)
- [Record React Native Sessions](https://help.splunk.com/en/splunk-observability-cloud/monitor-end-user-experience/real-user-monitoring/replay-user-sessions/record-react-native-sessions)

## Requirements

- [`@splunk/otel-react-native`](https://www.npmjs.com/package/@splunk/otel-react-native) >= 1.0.0 (installed and initialized)
- React Native >= 0.75.0
- React >= 18.2.0
- iOS >= 15.0
- Android minSdkVersion >= 24

## Installation

```bash
npm install @splunk/otel-session-replay-react-native
# or
yarn add @splunk/otel-session-replay-react-native
```

## Quick Start

### 1. Enable Session Replay in the core SDK

Pass a `SessionReplayModuleConfiguration` when initializing the core SDK:

```tsx
import { SplunkRumProvider, SessionReplayModuleConfiguration } from '@splunk/otel-react-native';

export default function App() {
  return (
    <SplunkRumProvider
      agentConfiguration={{
        appName: 'MyApp',
        deploymentEnvironment: 'production',
        endpoint: {
          rumAccessToken: 'YOUR_RUM_TOKEN',
          realm: 'us0',
        },
      }}
      modules={[
        new SessionReplayModuleConfiguration(true),
      ]}
    >
      <YourAppContent />
    </SplunkRumProvider>
  );
}
```

### 2. Control Replay at Runtime

```tsx
import { SplunkSessionReplay } from '@splunk/otel-session-replay-react-native';

// Start / stop recording
await SplunkSessionReplay.instance.start();
await SplunkSessionReplay.instance.stop();

// Check current state
const state = await SplunkSessionReplay.instance.getState();
console.log(state.status); // 'recording' | 'stopped' | ...
```

## Privacy

Masking is applied on the device. Masked areas are replaced by a grey hatch
pattern before the frame is encoded, so the underlying pixels never reach the
network or Splunk Observability Cloud.

### What is masked by default

The native SDKs decide sensitivity against the **native** view tree, so what
you get for free depends on which native class a React Native component
renders to.

| Component | Masked by default | Why |
|-----------|-------------------|-----|
| `<TextInput>` | **Yes** | Renders `ReactEditText` (an `android.widget.EditText`) and `RCTUITextField` / `RCTUITextView` (a `UITextField` / `UITextView`), all of which are on the default deny list. |
| `<Text>` | No | Not on any deny list. |
| `<Image>` | No | Not on any deny list. |
| WebView | No | The underlying SDKs mask web views, but the Splunk agents clear that default during install. |

Displayed data is usually just as sensitive as typed data, so treat the
defaults as a starting point rather than a complete policy.

### Mask a subtree with `<SensitiveView>`

Wrap anything that should not be recorded. Children need no session replay code
of their own.

```tsx
import { SensitiveView } from '@splunk/otel-session-replay-react-native';

<SensitiveView>
  <Text>{account.iban}</Text>
  <Image source={{ uri: customer.photoUrl }} />
</SensitiveView>;
```

### Masking and un-masking are not symmetric

This is the one thing worth understanding before relying on either.

**Masking composes downward.** `<SensitiveView>` covers its whole subtree,
because the mask is a rectangle over the view's frame and everything inside is
behind it.

**Un-masking does not.** `sensitive={false}` applies to that view only. It does
not un-mask descendants, and it does not punch a hole through an enclosing
`<SensitiveView>`. Sensitivity is resolved per view — own instance flag, then
own class, then superclasses — and no ancestor is ever consulted.

So to exempt one element from a class-level rule, put the flag on that element:

```tsx
await SplunkSessionReplay.instance.maskAllImages();

const ref = useRef<HostInstance>(null);

<Image ref={ref} source={brandLogo} />;

// Exempt this image only. Per-instance beats per-class.
const tag = findNodeHandle(ref.current as never);
if (tag != null) {
  await SplunkSessionReplay.instance.setViewSensitivity(tag, false);
}
```

And to carve a readable region out of a masked area, use an erasing recording
mask element (below) rather than nesting.

### Apply an app-wide policy

Class-level rules cover every current and future instance of a native view
class, including subclasses.

Each `NativeViewClass` entry is a set of class names rather than one name,
because the two React Native architectures mount different iOS classes and both
are compiled into the binary — so selecting by a single name would resolve
successfully and then mask nothing. The rule is applied to every name that
resolves, and only rejects if none do.

```tsx
import {
  SplunkSessionReplay,
  NativeViewClass,
} from '@splunk/otel-session-replay-react-native';

// Convenience helpers for the common cases.
await SplunkSessionReplay.instance.maskAllText();
await SplunkSessionReplay.instance.maskAllImages();
await SplunkSessionReplay.instance.maskWebViews();

// Or target a class directly.
await SplunkSessionReplay.instance.setClassSensitivity(
  NativeViewClass.SWITCH,
  true
);
await SplunkSessionReplay.instance.clearClassSensitivity(NativeViewClass.TEXT);
```

Precedence is per-instance, then per-class, then the SDK default — resolved
independently for each view. It does **not** extend to ancestors, so see the
note above on exempting an element.

### Why `<SensitiveView>` is a native component

It is a real host component rather than a styled `<View>` that gets flagged
afterwards, which removes two failure modes that would otherwise be the app's
problem:

- **Nothing to resolve.** The flag is applied to the native view as a prop when
  it is created, so there is no React tag lookup that can come back empty
  because mounting had not finished.
- **Nothing to clean up.** Both platforms recycle native views. The flag is
  released when the view is recycled, so a reused view cannot carry it into
  unrelated content. That matters most for `sensitive={false}`, where a leaked
  exemption would leave content visible that a class rule should have masked.

It accepts the full `ViewProps` surface, so `style`, borders, and layout behave
exactly as they do on `<View>`.

### Recording masks

Recording masks are screen-space rectangles that are independent of the view
tree, which makes them the right tool for content you do not own.

Rects are in React Native layout units on both platforms — the same units
`onLayout` and `measureInWindow` report — so a measured rect can be passed
straight through. (The native SDKs disagree internally: iOS masks in points and
Android in physical device pixels. The bridge converts.)

```tsx
import {
  MaskType,
  SplunkSessionReplay,
} from '@splunk/otel-session-replay-react-native';

ref.current?.measureInWindow((x, y, width, height) => {
  SplunkSessionReplay.instance.setRecordingMask({
    elements: [{ rect: { x, y, width, height }, type: MaskType.COVERING }],
  });
});

// Clear it again.
await SplunkSessionReplay.instance.setRecordingMask(null);
```

Elements are layered by array index. A `MaskType.ERASING` element reveals an
area covered by an earlier `MaskType.COVERING` element, which is how you build
"mask everything except this" policies.

Recording masks are only applied in `RenderingMode.NATIVE`.

### Rendering mode

The capture mode changes what masking means, so it is worth reading back before
relying on a privacy setting.

```tsx
import {
  RenderingMode,
  SplunkSessionReplay,
} from '@splunk/otel-session-replay-react-native';

const { renderingMode } = await SplunkSessionReplay.instance.getState();

await SplunkSessionReplay.instance.setRenderingMode(RenderingMode.NATIVE);
```

| Mode | Masking behaviour |
|------|-------------------|
| `NATIVE` | Sensitive areas covered by the masking pattern before encoding. Recording masks apply. |
| `WIREFRAME_ONLY` | No video frames. Sensitive text emitted as colour blocks. Recording masks are **not** applied. |

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `isEnabled` | `true` | Enable or disable session replay |
| `samplingRate` | `0.2` | Fraction of sessions to record (0.0 – 1.0) |

## License

Copyright 2025 Splunk Inc.

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.
