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
  s.static_framework = false

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  s.swift_version = "5.9"

  # SPM dependency for native iOS SDK
  spm_dependency(s,  
     url: 'https://github.com/signalfx/splunk-otel-ios.git', 
     requirement: { kind: 'exactVersion', version: '2.2.1' },
     products: ['SplunkAgent']
  )

  # This is required to make transitive SPM dependencies (e.g. OpenTelemetryApi through our agent) available
  # by providing these extended search paths (RN's spm_dependency helper only adds the root build-products dir to
  # SWIFT_INCLUDE_PATHS).
  # It's mirrored in session-replay aswell.
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "FRAMEWORK_SEARCH_PATHS" => "$(inherited) \"${SYMROOT}/${CONFIGURATION}${EFFECTIVE_PLATFORM_NAME}/PackageFrameworks\""
  }

  s.dependency "React-Core"

  install_modules_dependencies(s)
end

