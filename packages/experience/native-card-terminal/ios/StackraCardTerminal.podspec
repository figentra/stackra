# Stackra file contract:
# Purpose: the CocoaPods spec of the StackraCardTerminal Expo module: its Swift sources and the one vendor SDK it wraps,
#          Stripe Terminal's iOS SDK, fetched from CocoaPods at the app's `pod install` under Stripe's terms.
# Boundary: this repository holds no Stripe binary or source (ADR 0478 decision 4). The SDK major is pinned here; a
#           bump is a package release with its changeset. Certification pending (STA-739): not built on a developer Mac.
# Runtime: build (CocoaPods, at prebuild)
# Governing contract: ADR 0479 (decision 1); ADR 0478 (decisions 2 and 4).
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StackraCardTerminal'
  s.version        = package['version']
  s.summary        = 'Stripe Terminal behind the Stackra CardTerminal port'
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/figentra/stackra.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'StripeTerminal', '~> 4.0'

  s.source_files = '**/*.swift'
end
