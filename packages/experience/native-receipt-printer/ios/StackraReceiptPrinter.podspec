# Stackra file contract:
# Purpose: the iOS pod of the `StackraReceiptPrinter` Expo module: it compiles the module and only the vendor families
#          the app's runway lists (`stackra.receiptPrinter.vendors` in Podfile.properties.json, written by the package's
#          config plugin), and declares only their SDKs.
# Boundary: build configuration only. No vendor binary or source lives in this package (ADR 0478 decision 4): Star's
#           StarIO10 comes from CocoaPods trunk; Epson's libepos2.xcframework is fetched from Epson's portal by the build
#           and named by the plugin option `ios.epsonFramework`. A listed Epson family without it fails `pod install`.
# Runtime: ios
# Governing contract: ADR 0478 (decisions 2 and 4); ADR 0442 (decision 3).
require 'json'
require 'pathname'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
properties_path = File.join(Pod::Config.instance.installation_root.to_s, 'Podfile.properties.json')
properties = File.exist?(properties_path) ? JSON.parse(File.read(properties_path)) : {}
vendors = (properties['stackra.receiptPrinter.vendors'] || '').split(',').map(&:strip).reject(&:empty?)

Pod::Spec.new do |s|
  s.name           = 'StackraReceiptPrinter'
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

  sources = ['StackraReceiptPrinterModule.swift', 'VendorPrinter.swift']
  conditions = []

  if vendors.include?('star')
    s.dependency 'StarIO10', properties['stackra.receiptPrinter.starVersion'] || '~> 1.8'
    sources << 'Star/*.swift'
    conditions << 'STACKRA_STAR'
  end

  if vendors.include?('epson')
    framework = properties['stackra.receiptPrinter.epsonFramework']
    raise '@stackra/native-receipt-printer: set ios.epsonFramework in the plugin options' if framework.nil?
    s.vendored_frameworks = Pathname.new(framework).relative_path_from(Pathname.new(__dir__)).to_s
    sources << 'Epson/*.swift'
    conditions << 'STACKRA_EPSON'
  end

  s.source_files = sources
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_ACTIVE_COMPILATION_CONDITIONS' => (['$(inherited)'] + conditions).join(' ')
  }
end
