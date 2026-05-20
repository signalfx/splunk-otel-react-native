require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SplunkOtelReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.0" }
  s.source       = { :git => "" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.exclude_files = ["ios/frameworks/*.xcframework/**/*.h"]
  s.private_header_files = "ios/**/*.h"

  s.preserve_paths = [
    "ios/*.xcframework",
    "ios/**/*.h",
    "ios/*.xcframework/**/*.h"
  ]

  s.swift_version = "5.9"

  s.vendored_frameworks =
    "ios/frameworks/SplunkAgent.xcframework",
    "ios/frameworks/SplunkAgentObjC.xcframework",
    "ios/frameworks/SplunkAppStart.xcframework",
    "ios/frameworks/SplunkAppState.xcframework",
    "ios/frameworks/SplunkCommon.xcframework",
    "ios/frameworks/SplunkCrashReports.xcframework",
    "ios/frameworks/SplunkCustomTracking.xcframework",
    "ios/frameworks/SplunkInteractions.xcframework",
    "ios/frameworks/SplunkNavigation.xcframework",
    "ios/frameworks/SplunkNetwork.xcframework",
    "ios/frameworks/SplunkNetworkMonitor.xcframework",
    "ios/frameworks/SplunkOpenTelemetry.xcframework",
    "ios/frameworks/SplunkOpenTelemetryBackgroundExporter.xcframework",
    "ios/frameworks/SplunkSessionReplayProxy.xcframework",
    "ios/frameworks/SplunkSlowFrameDetector.xcframework",
    "ios/frameworks/SplunkWebView.xcframework",
    "ios/frameworks/OpenTelemetryApi.xcframework",
    "ios/frameworks/OpenTelemetrySdk.xcframework",
    "ios/frameworks/CrashReporter.xcframework",
    "ios/frameworks/CiscoCommon.xcframework",
    "ios/frameworks/CiscoDiskStorage.xcframework",
    "ios/frameworks/CiscoEncryption.xcframework",
    "ios/frameworks/CiscoInstanceManager.xcframework",
    "ios/frameworks/CiscoInteractions.xcframework",
    "ios/frameworks/CiscoLogger.xcframework",
    "ios/frameworks/CiscoRuntimeCache.xcframework",
    "ios/frameworks/CiscoSessionReplay.xcframework",
    "ios/frameworks/CiscoSwizzling.xcframework"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_VERSION" => "5.0"
  }

  s.dependency "React-Core"

  install_modules_dependencies(s)
end

