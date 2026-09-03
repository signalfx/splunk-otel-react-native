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
# Reproduce the "background launch inflates cold start" scenario for the Splunk RUM
# React Native SDK on the iOS Simulator, deterministically.
#
# Why not a real silent push: on the Simulator, `xcrun simctl push` does NOT cold-launch
# a terminated app into the background, so a push-then-sleep-then-foreground sequence
# would leave no process running during the wait and then measure an ordinary (short)
# cold start -- a false negative. Instead we reproduce the SAME native anchoring problem
# by cold-launching an app that was BUILT with a baked-in install delay
# (SPLUNK_INSTALL_DELAY_SECONDS): the process starts at T0 but SplunkRum install() only
# runs at T0 + DELAY_SECONDS, so the AppStart span is inflated by ~DELAY_SECONDS.
#
# For a real background launch (production trigger), use a physical device with either
# Xcode's "Launch due to a background fetch event" or a genuine silent push (APNs).
#
# What it does:
#   1. Terminates the app so the next launch is a fresh (cold) process.
#   2. Cold-launches the app. The process starts now (cold anchor = T0) and the app's
#      own hook defers SplunkRum install() by DELAY_SECONDS.
#   3. Waits for the deferred install (plus a small buffer) so the inflated AppStart
#      span is emitted before you inspect.
#
# Prerequisites:
#   - A booted iOS Simulator with the app installed, BUILT with the matching delay:
#       SPLUNK_INSTALL_DELAY_SECONDS=60 yarn ios
#     then stop the app (this script re-launches it cold).
#   - DELAY_SECONDS passed to this script MUST match the baked-in SPLUNK_INSTALL_DELAY_SECONDS.
#
# Usage:
#   tool/simulate_background_launch.sh [UDID] [BUNDLE_ID] [DELAY_SECONDS]
#
# Defaults:
#   UDID          -> "booted"
#   BUNDLE_ID     -> splunkotelreactnative.example
#   DELAY_SECONDS -> 60

set -euo pipefail

UDID="${1:-booted}"
BUNDLE_ID="${2:-splunkotelreactnative.example}"
DELAY_SECONDS="${3:-60}"

# Small buffer so we don't start inspecting before install() + the AppStart span fire.
BUFFER_SECONDS=5

echo "==> Simulator:     ${UDID}"
echo "==> Bundle id:     ${BUNDLE_ID}"
echo "==> Install delay: ${DELAY_SECONDS}s (must match SPLUNK_INSTALL_DELAY_SECONDS)"
echo

echo "==> [1/3] Terminating app to force a fresh cold process on next launch..."
xcrun simctl terminate "${UDID}" "${BUNDLE_ID}" || true

echo "==> [2/3] Cold-launching app (process starts at T0; install() deferred ${DELAY_SECONDS}s)..."
xcrun simctl launch "${UDID}" "${BUNDLE_ID}"

echo "==> [3/3] Waiting $((DELAY_SECONDS + BUFFER_SECONDS))s for the deferred install + AppStart span..."
sleep "$((DELAY_SECONDS + BUFFER_SECONDS))"

echo
echo "Done. Now inspect:"
echo "  - Console.app / device logs: filter for [AppStart] and SplunkRum AppStart output."
echo "    Expect SplunkRum install() to run ~${DELAY_SECONDS}s after process start."
echo "  - Splunk RUM: the AppStart span (component=appstart). Check start.type and duration."
echo "    Bug reproduced  => start.type=cold with duration ~${DELAY_SECONDS}s."
echo "    Mitigated       => start.type=warm (or span suppressed)."
