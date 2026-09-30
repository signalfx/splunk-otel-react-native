#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
IOS_DIR="${EXAMPLE_DIR}/ios"
WORKSPACE="${IOS_DIR}/SplunkOtelReactNativeExample.xcworkspace"
SCHEME="SplunkOtelReactNativeExample"
SOURCEMAP_DIR="${IOS_DIR}/sourcemaps"

mkdir -p "${SOURCEMAP_DIR}"

SIMULATOR_NAME="${SIMULATOR_NAME:-iPhone 17}"
SDK="iphonesimulator"

echo "Building ${SCHEME} (Release, ${SDK}, ${SIMULATOR_NAME})..."
cd "${IOS_DIR}"

xcodebuild \
  -workspace "${WORKSPACE}" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -sdk "${SDK}" \
  -destination "platform=iOS Simulator,name=${SIMULATOR_NAME}" \
  build

APP_PATH="$(find "${HOME}/Library/Developer/Xcode/DerivedData" -path "*/Build/Products/Release-iphonesimulator/${SCHEME}.app" -print -quit)"

if [[ -z "${APP_PATH}" || ! -d "${APP_PATH}" ]]; then
  echo "error: Could not locate Release simulator .app in DerivedData" >&2
  exit 1
fi

BOOTED_UDID="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ {print $2; exit}')"
if [[ -z "${BOOTED_UDID}" ]]; then
  echo "Booting simulator: ${SIMULATOR_NAME}"
  xcrun simctl boot "${SIMULATOR_NAME}" || true
  BOOTED_UDID="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ {print $2; exit}')"
fi

echo "Installing ${APP_PATH}"
xcrun simctl install "${BOOTED_UDID}" "${APP_PATH}"

echo "Launching splunkotelreactnative.example"
xcrun simctl launch "${BOOTED_UDID}" splunkotelreactnative.example

echo ""
echo "Release simulator build is running."
echo "Embedded bundle: ${APP_PATH}/main.jsbundle"
if [[ -f "${SOURCEMAP_DIR}/main.jsbundle.map" ]]; then
  echo "Source map:      ${SOURCEMAP_DIR}/main.jsbundle.map"
else
  echo "Source map:      not found at ${SOURCEMAP_DIR}/main.jsbundle.map"
  echo "                 Re-run the build and check the Xcode 'Bundle React Native code and images' phase."
fi
