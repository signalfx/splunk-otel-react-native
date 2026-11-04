#!/bin/bash

# Copyright 2025 Splunk Inc.
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

set -euo pipefail

DRY_RUN="${SPLUNK_RUM_SOURCE_MAP_DRY_RUN:-NO}"
ENABLED="${SPLUNK_RUM_SOURCE_MAP_ENABLED:-NO}"
if [[ "$DRY_RUN" != "YES" && "$ENABLED" != "YES" ]]; then
  exit 0
fi

require_environment_value() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "error: Splunk RUM iOS integration requires $name." >&2
    exit 1
  fi
}

require_file() {
  local description="$1"
  local path="$2"
  if [[ ! -f "$path" ]]; then
    echo "error: $description was not found at $path." >&2
    exit 1
  fi
}

require_environment_value CONFIGURATION_BUILD_DIR
require_environment_value UNLOCALIZED_RESOURCES_FOLDER_PATH

if [[ -n "${PROJECT_ROOT:-}" ]]; then
  RN_PROJECT_ROOT="$PROJECT_ROOT"
elif [[ -n "${SRCROOT:-}" ]]; then
  RN_PROJECT_ROOT="$SRCROOT/.."
else
  echo "error: Splunk RUM iOS integration requires PROJECT_ROOT or SRCROOT." >&2
  exit 1
fi

NODE_EXECUTABLE="${NODE_BINARY:-node}"
CLI_PATH="${SPLUNK_RUM_CLI_PATH:-$RN_PROJECT_ROOT/node_modules/.bin/splunk-rum}"
BUNDLE_BASENAME="${BUNDLE_NAME:-main}.jsbundle"
BUNDLE_PATH="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/$BUNDLE_BASENAME"
ENGINE="hermes"
if [[ "${USE_HERMES:-true}" == "false" ]]; then
  ENGINE="jsc"
fi

require_file "Splunk RUM CLI" "$CLI_PATH"
ARTIFACTS_CONFIG="${SPLUNK_RUM_ARTIFACTS_CONFIG:-}"
if [[ -n "$ARTIFACTS_CONFIG" ]]; then
  require_file "React Native artifacts configuration" "$ARTIFACTS_CONFIG"
else
  require_environment_value SOURCEMAP_FILE
  require_file "Final React Native bundle" "$BUNDLE_PATH"
  require_file "Final React Native source map" "$SOURCEMAP_FILE"
fi

cli_command=("$CLI_PATH")
if [[ "$CLI_PATH" == *.js ]]; then
  cli_command=("$NODE_EXECUTABLE" "$CLI_PATH")
fi

arguments=(
  react-native sourcemaps upload
  --platform ios
  --engine "$ENGINE"
)

if [[ "$DRY_RUN" == "YES" ]]; then
  arguments+=(--dry-run)
fi

if [[ -n "$ARTIFACTS_CONFIG" ]]; then
  arguments+=(--artifacts "$ARTIFACTS_CONFIG")
else
  arguments+=(
    --bundle-name "$BUNDLE_BASENAME"
    --bundle "$BUNDLE_PATH"
    --source-map "$SOURCEMAP_FILE"
  )
fi

result="$("${cli_command[@]}" "${arguments[@]}")"
echo "$result"
if [[ "$DRY_RUN" == "YES" ]]; then
  echo "Splunk RUM React Native source-map dry run completed."
  echo "The source map was NOT uploaded; this build is for contract validation only."
else
  echo "Splunk RUM React Native source-map upload completed."
fi
