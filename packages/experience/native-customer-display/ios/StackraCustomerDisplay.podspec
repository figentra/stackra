# Stackra file contract:
# Purpose: the CocoaPods spec of the `StackraCustomerDisplay` Expo module (the iPad's external customer display), read
#          by autolinking at prebuild.
# Boundary: build metadata only; SwiftUI and UIKit are system frameworks, so no vendor pod is fetched.
# Runtime: ios
# Governing contract: ADR 0478 (decisions 2 and 4); ADR 0430 (decision 1).
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StackraCustomerDisplay'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/figentra/stackra.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'StackraCustomerDisplayModule.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
