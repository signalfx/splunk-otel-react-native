#!/bin/bash

# Script to switch between old and new React Native architecture, primarly for local testing.
# Usage: ./scripts/set-arch.sh [new|old]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
EXAMPLE_DIR="$ROOT_DIR/example"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

usage() {
    echo "Usage: $0 [new|old]"
    echo ""
    echo "Commands:"
    echo "  new    Enable New Architecture (TurboModules/Fabric)"
    echo "  old    Enable Old Architecture (Bridge)"
    echo ""
    echo "This script will:"
    echo "  1. Update Android gradle.properties"
    echo "  2. Update iOS Podfile"
    echo "  3. Clean build artifacts"
    echo "  4. Re-install iOS pods"
    exit 1
}

clean_android() {
    print_status "Cleaning Android build artifacts..."
    rm -rf "$EXAMPLE_DIR/android/build"
    rm -rf "$EXAMPLE_DIR/android/app/build"
    rm -rf "$EXAMPLE_DIR/android/.gradle"
    rm -rf "$ROOT_DIR/packages/core/android/build"
}

clean_ios() {
    print_status "Cleaning iOS build artifacts..."
    rm -rf "$EXAMPLE_DIR/ios/build"
    rm -rf "$EXAMPLE_DIR/ios/Pods"
    rm -rf "$EXAMPLE_DIR/ios/Podfile.lock"
    rm -rf "$ROOT_DIR/packages/core/ios/build"
}

set_android_arch() {
    local enabled=$1
    local gradle_file="$EXAMPLE_DIR/android/gradle.properties"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^newArchEnabled=.*/newArchEnabled=$enabled/" "$gradle_file"
    else
        # Workaround for CI Linux
        sed -i "s/^newArchEnabled=.*/newArchEnabled=$enabled/" "$gradle_file"
    fi
    print_status "Android: newArchEnabled=$enabled"
}

set_ios_arch() {
    local enabled=$1
    local podfile="$EXAMPLE_DIR/ios/Podfile"
    
    if [[ "$enabled" == "1" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^ENV\['RCT_NEW_ARCH_ENABLED'\] = '0'/ENV['RCT_NEW_ARCH_ENABLED'] = '1'/" "$podfile"
            sed -i '' "s/^# ENV\['RCT_NEW_ARCH_ENABLED'\] = '1'/ENV['RCT_NEW_ARCH_ENABLED'] = '1'/" "$podfile"
        else
            sed -i "s/^ENV\['RCT_NEW_ARCH_ENABLED'\] = '0'/ENV['RCT_NEW_ARCH_ENABLED'] = '1'/" "$podfile"
            sed -i "s/^# ENV\['RCT_NEW_ARCH_ENABLED'\] = '1'/ENV['RCT_NEW_ARCH_ENABLED'] = '1'/" "$podfile"
        fi
    else
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^ENV\['RCT_NEW_ARCH_ENABLED'\] = '1'/ENV['RCT_NEW_ARCH_ENABLED'] = '0'/" "$podfile"
        else
            sed -i "s/^ENV\['RCT_NEW_ARCH_ENABLED'\] = '1'/ENV['RCT_NEW_ARCH_ENABLED'] = '0'/" "$podfile"
        fi
    fi
    print_status "iOS: RCT_NEW_ARCH_ENABLED=$enabled"
}

install_pods() {
    print_status "Installing iOS pods..."
    cd "$EXAMPLE_DIR/ios"
    USE_FRAMEWORKS=dynamic bundle exec pod install || USE_FRAMEWORKS=dynamic pod install
    cd "$ROOT_DIR"
}

# Main
if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    new)
        echo ""
        echo "Switching to NEW Architecture..."
        echo ""
        clean_android
        clean_ios
        set_android_arch "true"
        set_ios_arch "1"
        install_pods
        echo ""
        print_status "New Architecture enabled."
        echo ""
        echo "Next steps:"
        echo "  yarn android    # Run Android app"
        echo "  yarn ios        # Run iOS app"
        ;;
    old)
        echo ""
        echo "Switching to OLD Architecture..."
        echo ""
        clean_android
        clean_ios
        set_android_arch "false"
        set_ios_arch "0"
        install_pods
        echo ""
        print_status "Old Architecture enabled."
        echo ""
        echo "Next steps:"
        echo "  yarn android    # Run Android app"
        echo "  yarn ios        # Run iOS app"
        ;;
    *)
        print_error "Unknown command: $1"
        usage
        ;;
esac
