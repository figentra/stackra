// Stackra file contract:
// Purpose: LocationPermission, which asks iOS for the when-in-use location the Stripe SDK needs and answers whether
//          it is granted; Bluetooth is read from CBManager and prompted by the SDK's own discovery.
// Boundary: asks only; the usage strings come from the config plugin. Certification pending (STA-739).
// Runtime: ios
// Governing contract: ADR 0479 (decisions 2 and 6).
import CoreBluetooth
import CoreLocation

final class LocationPermission: NSObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  private var waiting: ((Bool) -> Void)?

  /// Whether Bluetooth is not refused (not yet asked counts as not refused: the SDK asks).
  static var isBluetoothAllowed: Bool {
    let state = CBManager.authorization
    return state != .denied && state != .restricted
  }

  /// Asks for the location when it was never asked, and answers whether it is granted.
  func request(_ done: @escaping (Bool) -> Void) {
    switch manager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways: done(true)
    case .notDetermined:
      waiting = done
      manager.delegate = self
      manager.requestWhenInUseAuthorization()
    default: done(false)
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard manager.authorizationStatus != .notDetermined, let done = waiting else { return }
    waiting = nil
    done(manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways)
  }
}
