// Stackra file contract:
// Purpose: `ScaleLinkError`, why a link did not open, as the Expo exceptions the TypeScript driver maps to refusals:
//          code `E_PERMISSION` (Bluetooth not allowed) or `E_UNAVAILABLE` (anything else).
// Boundary: the two codes equal those `NativeScaleModule.connect` documents; the message is for logs only.
// Runtime: iOS
// Governing contract: ADR 0478 (decision 5); ADR 0250 (decision 3).
import ExpoModulesCore

enum ScaleLinkError: Error {
  case permission(String)
  case unavailable(String)

  var exception: Exception {
    switch self {
    case .permission(let message):
      return Exception(name: "E_PERMISSION", description: message, code: "E_PERMISSION")
    case .unavailable(let message):
      return Exception(name: "E_UNAVAILABLE", description: message, code: "E_UNAVAILABLE")
    }
  }
}
