# Stackra file contract:
# Purpose: the iOS pod of the `StackraCashDrawer` Expo module, so the module registers on iOS and every call there
#          rejects (the driver refuses) instead of the module being missing.
# Boundary: build configuration only. iOS has no drawer port family (Sunmi and PAX are Android terminals); a drawer on
#           an Epson or Star printer opens through @stackra/native-receipt-printer (`printer_kick`). No vendor SDK.
# Runtime: ios
# Governing contract: ADR 0478 (decisions 2 and 4).
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StackraCashDrawer'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/figentra/stackra.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'StackraCashDrawerModule.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
