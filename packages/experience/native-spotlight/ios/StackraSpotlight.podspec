# Stackra file contract:
# Purpose: the CocoaPods spec of the StackraSpotlight Expo module (iOS Core Spotlight), read by autolinking at prebuild.
# Boundary: build metadata only; Core Spotlight is a system framework, so no vendor pod is fetched.
# Runtime: build (CocoaPods)
# Governing contract: ADR 0478 (decisions 2 and 4).
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StackraSpotlight'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/figentra/stackra.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreSpotlight'

  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
