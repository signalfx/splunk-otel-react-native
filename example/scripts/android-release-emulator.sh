#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ANDROID_DIR="${EXAMPLE_DIR}/android"
SOURCEMAP_DIR="${ANDROID_DIR}/sourcemaps"
SOURCEMAP_SRC="${ANDROID_DIR}/app/build/generated/sourcemaps/react/release/index.android.bundle.map"
APK_PATH="${ANDROID_DIR}/app/build/outputs/apk/release/app-release.apk"
PACKAGE="splunkotelreactnative.example"
ACTIVITY="${PACKAGE}/.MainActivity"

mkdir -p "${SOURCEMAP_DIR}"

echo "Building Android release APK (embedded bundle, Hermes)..."
cd "${ANDROID_DIR}"
./gradlew assembleRelease --no-daemon

if [[ ! -f "${APK_PATH}" ]]; then
  echo "error: Release APK not found at ${APK_PATH}" >&2
  exit 1
fi

if [[ -f "${SOURCEMAP_SRC}" ]]; then
  cp "${SOURCEMAP_SRC}" "${SOURCEMAP_DIR}/index.android.bundle.map"
  echo "Source map copied to ${SOURCEMAP_DIR}/index.android.bundle.map"
else
  echo "warning: Source map not found at ${SOURCEMAP_SRC}" >&2
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found; APK built but not installed."
  echo "APK: ${APK_PATH}"
  exit 0
fi

DEVICE="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
if [[ -z "${DEVICE}" ]]; then
  echo "No Android device/emulator detected. Start an emulator, then run:"
  echo "  adb uninstall ${PACKAGE} || true"
  echo "  adb install -r ${APK_PATH}"
  echo "  adb shell am start -n ${ACTIVITY}"
  exit 0
fi

echo "Removing any existing install (debug or release)..."
adb -s "${DEVICE}" uninstall "${PACKAGE}" >/dev/null 2>&1 || true

echo "Installing release APK on ${DEVICE}..."
adb -s "${DEVICE}" install -r "${APK_PATH}"

DEBUGGABLE="$(adb -s "${DEVICE}" shell dumpsys package "${PACKAGE}" | awk -F= '/DEBUGGABLE/ {print $2; exit}')"
if [[ "${DEBUGGABLE}" == "true" ]]; then
  echo "error: Installed package is still debuggable; expected a release build." >&2
  exit 1
fi

echo "Launching ${PACKAGE} (release — Metro is not required)..."
adb -s "${DEVICE}" shell am force-stop "${PACKAGE}" || true
adb -s "${DEVICE}" shell am start -n "${ACTIVITY}"

echo ""
echo "Release build is running."
echo "APK:         ${APK_PATH}"
echo "Source map:  ${SOURCEMAP_DIR}/index.android.bundle.map"
echo "(Gradle also writes: ${SOURCEMAP_SRC})"
