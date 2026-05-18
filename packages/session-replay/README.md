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
await SplunkSessionReplay.start();
await SplunkSessionReplay.stop();

// Check current state
const state = await SplunkSessionReplay.getState();
console.log(state.status); // 'recording' | 'stopped' | ...

// Manage recording masks
const mask = await SplunkSessionReplay.getRecordingMask();
await SplunkSessionReplay.setRecordingMask(updatedMask);
```

## Recording Masks

Control what is captured by applying mask types to UI elements:

| Mask Type | Behavior |
|-----------|----------|
| `sensitive` | Content is masked but layout is preserved |
| `hidden` | Element is hidden entirely from the replay |
| `allowed` | Content is captured as-is |

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable or disable session replay |
| `sampleRate` | `0.2` | Fraction of sessions to record (0.0 – 1.0) |

## License

Copyright 2025 Splunk Inc.

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.
