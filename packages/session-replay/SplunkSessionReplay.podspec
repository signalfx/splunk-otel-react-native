require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SplunkSessionReplay"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.0" }
  s.source       = { :git => "" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  s.swift_version = "5.9"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_VERSION" => "5.0",
    "FRAMEWORK_SEARCH_PATHS" => "$(inherited) \"${PODS_XCFRAMEWORKS_BUILD_DIR}/SplunkOtelReactNative\""
  }

  s.dependency "React-Core"
  s.dependency "SplunkOtelReactNative"

  install_modules_dependencies(s)
end
