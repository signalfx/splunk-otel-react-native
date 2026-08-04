#!/usr/bin/env bash
#
# Copyright 2026 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Simulate an iOS background (silent-push) launch on the Simulator to reproduce the
# "background launch inflates cold start" scenario for the Splunk RUM React Native SDK.
#
# NOTE ON THE SIMULATOR: `xcrun simctl push` does NOT cold-launch a terminated app
# into the background. Use this script for a quick smoke test, but reproduce the real
# inflated cold start with one of:
#   1. SPLUNK_INSTALL_DELAY_SECONDS=25 (deterministic, works on Simulator AND device)
#   2. A real device + Xcode "Launch due to a background fetch event" (no APNs)
#   3. A real device + a genuine silent push (needs APNs credentials)
# See tool/BACKGROUND_LAUNCH_SIMULATION.md for details.
#
# What it does:
#   1. Terminates the app so the next launch is a fresh (cold) process.
#   2. Delivers a silent content-available push.
#   3. Sleeps for RESIDENCE_SECONDS to simulate the app sitting in the background.
#   4. Foregrounds the app, which triggers didBecomeActive and the AppStart span.
#
# Usage:
#   tool/simulate_background_launch.sh [UDID] [BUNDLE_ID] [RESIDENCE_SECONDS]
#
# Defaults:
#   UDID              -> "booted"
#   BUNDLE_ID         -> splunkotelreactnative.example
#   RESIDENCE_SECONDS -> 60

set -euo pipefail

UDID="${1:-booted}"
BUNDLE_ID="${2:-splunkotelreactnative.example}"
RESIDENCE_SECONDS="${3:-60}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="${SCRIPT_DIR}/../ios/silent-push.apns"

if [[ ! -f "${PAYLOAD}" ]]; then
  echo "Error: silent-push payload not found at ${PAYLOAD}" >&2
  exit 1
fi

echo "==> Simulator:        ${UDID}"
echo "==> Bundle id:        ${BUNDLE_ID}"
echo "==> Residence:        ${RESIDENCE_SECONDS}s"
echo "==> Payload:          ${PAYLOAD}"
echo

echo "==> [1/4] Terminating app to force a fresh cold process on next launch..."
xcrun simctl terminate "${UDID}" "${BUNDLE_ID}" || true

echo "==> [2/4] Delivering silent push (background cold launch)..."
xcrun simctl push "${UDID}" "${BUNDLE_ID}" "${PAYLOAD}"

echo "==> [3/4] Simulating ${RESIDENCE_SECONDS}s of background residence..."
sleep "${RESIDENCE_SECONDS}"

echo "==> [4/4] Foregrounding app (triggers didBecomeActive / AppStart)..."
xcrun simctl launch "${UDID}" "${BUNDLE_ID}"

echo
echo "Done. Now inspect:"
echo "  - Console.app / device logs: filter for [BG-LAUNCH-PROBE] and SplunkRum AppStart output."
echo "    Expect a 'process-start -> didBecomeActive delta' of ~${RESIDENCE_SECONDS}s."
echo "  - Splunk RUM: the AppStart span (component=appstart). Check start.type and duration."
echo "    Bug reproduced  => start.type=cold with duration ~${RESIDENCE_SECONDS}s."
echo "    Mitigated       => start.type=warm (or span suppressed)."
