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
     requirement: { kind: 'upToNextMajorVersion', minimumVersion: '2.0.4' },
     products: ['SplunkAgent']
  )

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }

  s.dependency "React-Core"

  install_modules_dependencies(s)
end

