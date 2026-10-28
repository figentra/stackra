# Stackra file contract:
# Purpose: the CocoaPods spec of the StackraNativeScale Expo module (ADR 0478 decision 2): the Swift sources in this
#          folder, CoreBluetooth, and ExpoModulesCore, linked into an app by autolinking at prebuild.
# Boundary: no vendor SDK: scale protocols are plain serial text, so the module needs only the platform's Bluetooth
#           API. A vendor SDK would be declared here and only here (ADR 0478 decision 4).
# Runtime: build (CocoaPods)
# Governing contract: ADR 0478 (decisions 2, 4 and 7).
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StackraNativeScale'
  s.version        = package['version']
  s.summary        = 'Stackra native scale: the byte link behind the Scale port.'
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/figentra/stackra.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreBluetooth'

  s.source_files = '**/*.swift'
end
