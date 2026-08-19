#!/bin/bash

# Strips build-machine artifacts that leak absolute paths and internal source
# structure from the vendored iOS xcframeworks before they are committed to this
# public repository.
#
# Prebuilt Swift xcframeworks embed the absolute paths of the machine that built
# them (e.g. "/Users/<name>/.../<private-repo>/.../File.swift") inside several
# build byproducts. None of these are needed to compile or link against a binary
# xcframework, so we remove them:
#
#   - *.abi.json          Swift ABI-diff descriptors (JSON "filePath" fields).
#   - *.swiftsourceinfo   Source locations used only for debugging.
#   - dSYMs/              DWARF + Relocations/*.yml embed absolute source paths.
#
# The now-dangling "DebugSymbolsPath" key is also cleared from each xcframework
# Info.plist so the bundle stays internally consistent.
#
# The proper long-term fix belongs in the native SDK build (path prefix-mapping
# via -file-prefix-map / -debug-prefix-map). This script is the repo-side guard
# so a leaky framework drop can never be committed or published.
#
# Usage:
#   scripts/sanitize-frameworks.sh          Sanitize in place (macOS; uses PlistBuddy).
#   scripts/sanitize-frameworks.sh --check  Verify only. Non-zero exit if a leak is
#                                           found. Cross-platform (CI-safe).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1"; }

# Marker for a leaked build-machine path. The native iOS frameworks are built on
# macOS, so real leaks are "/Users/<user>/..." absolute paths embedded in the
# binary swiftmodule, swiftinterface, or dSYM DWARF. This is intentionally narrow
# to avoid false positives on benign doc examples (e.g. OpenTelemetry semantic-
# convention docs use "/home/..." sample values). The JSON-escaped "\/Users\/"
# form that appears in *.abi.json is covered by the artifact-name check below.
PATH_MARKER='/Users/'

CHECK_ONLY=0
if [ "${1:-}" = "--check" ]; then
  CHECK_ONLY=1
elif [ -n "${1:-}" ]; then
  err "Unknown argument: $1"
  echo "Usage: $0 [--check]"
  exit 2
fi

# Discover vendored xcframework roots (packages/*/ios/frameworks).
roots=()
for candidate in "$ROOT_DIR"/packages/*/ios/frameworks; do
  [ -d "$candidate" ] && roots+=("$candidate")
done

if [ ${#roots[@]} -eq 0 ]; then
  info "No vendored xcframeworks found; nothing to do."
  exit 0
fi

# ---------------------------------------------------------------------------
# Check mode: report leaks without modifying anything. Cross-platform.
# ---------------------------------------------------------------------------
if [ "$CHECK_ONLY" -eq 1 ]; then
  leaks=0

  for root in "${roots[@]}"; do
    # Leftover byproduct files that should have been stripped.
    while IFS= read -r artifact; do
      [ -n "$artifact" ] || continue
      err "leftover artifact: ${artifact#"$ROOT_DIR"/}"
      leaks=1
    done < <(find "$root" \
      \( -name '*.abi.json' -o -name '*.swiftsourceinfo' -o -type d -name 'dSYMs' \) \
      -prune -print 2>/dev/null)

    # Any residual absolute build path embedded in a framework file.
    while IFS= read -r hit; do
      [ -n "$hit" ] || continue
      err "embedded build path: ${hit#"$ROOT_DIR"/}"
      leaks=1
    done < <(grep -rlaF "$PATH_MARKER" "$root" 2>/dev/null || true)
  done

  if [ "$leaks" -ne 0 ]; then
    echo
    err "Vendored xcframeworks contain leaked build paths."
    echo "  Run 'scripts/sanitize-frameworks.sh' (on macOS) to strip them."
    exit 1
  fi

  info "Vendored xcframeworks are clean (no leaked build paths)."
  exit 0
fi

# ---------------------------------------------------------------------------
# Strip mode: remove leaking artifacts in place. Requires macOS PlistBuddy for
# the Info.plist edit.
# ---------------------------------------------------------------------------
PLIST_BUDDY="/usr/libexec/PlistBuddy"
have_plistbuddy=1
if [ ! -x "$PLIST_BUDDY" ]; then
  have_plistbuddy=0
  warn "PlistBuddy not found; will delete artifacts but not edit Info.plist (run on macOS to finish)."
fi

removed_abi=0
removed_sourceinfo=0
removed_dsyms=0

for root in "${roots[@]}"; do
  info "Sanitizing ${root#"$ROOT_DIR"/}"

  while IFS= read -r f; do
    [ -n "$f" ] || continue
    rm -f "$f"
    removed_abi=$((removed_abi + 1))
  done < <(find "$root" -name '*.abi.json' 2>/dev/null)

  while IFS= read -r f; do
    [ -n "$f" ] || continue
    rm -f "$f"
    removed_sourceinfo=$((removed_sourceinfo + 1))
  done < <(find "$root" -name '*.swiftsourceinfo' 2>/dev/null)

  # -prune so find does not descend into a directory it is about to delete.
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    rm -rf "$d"
    removed_dsyms=$((removed_dsyms + 1))
  done < <(find "$root" -type d -name 'dSYMs' -prune -print 2>/dev/null)

  # Clear the dangling DebugSymbolsPath key from each xcframework Info.plist.
  if [ "$have_plistbuddy" -eq 1 ]; then
    for plist in "$root"/*.xcframework/Info.plist; do
      [ -f "$plist" ] || continue
      for i in 0 1 2 3 4 5 6 7; do
        "$PLIST_BUDDY" -c "Delete :AvailableLibraries:$i:DebugSymbolsPath" "$plist" 2>/dev/null || true
      done
    done
  fi
done

echo
info "Removed: ${removed_abi} .abi.json, ${removed_sourceinfo} .swiftsourceinfo, ${removed_dsyms} dSYMs dir(s)."

# Self-verify.
if "$0" --check; then
  info "Sanitization complete."
else
  err "Leaks remain after sanitization; inspect the output above."
  exit 1
fi
