// Stackra file contract:
// Purpose: the names the module sends JavaScript for Stripe Terminal's Objective-C enums (error codes, payment status,
//          intent status, device type), which Swift cannot print by case name: each is the SDK's own case name,
//          spelled out, never a Stackra meaning. The TypeScript drivers read them (`sdkName`).
// Boundary: naming only; a case missing here is sent as `sdk_<raw value>`, so nothing is hidden. Certification
//           pending (STA-739): the cases are transcribed from Stripe's public iOS SDK documents.
// Runtime: ios
// Governing contract: ADR 0479 (decision 1: the module maps nothing); ADR 0478 (decision 5).
import Foundation
import StripeTerminal

enum SdkNames {
  static func error(_ error: Error) -> [String: Any] {
    let nsError = error as NSError
    let name: String
    switch ErrorCode.Code(rawValue: nsError.code) {
    case .some(.canceled): name = "canceled"
    case .some(.bluetoothAccessDenied): name = "bluetoothAccessDenied"
    case .some(.bluetoothDisabled): name = "bluetoothDisabled"
    case .some(.locationServicesDisabled): name = "locationServicesDisabled"
    case .some(.notConnectedToReader): name = "notConnectedToReader"
    case .some(.alreadyConnectedToReader): name = "alreadyConnectedToReader"
    case .some(.readerBusy): name = "readerBusy"
    case .some(.declinedByStripeAPI): name = "declinedByStripeAPI"
    case .some(.declinedByReader): name = "declinedByReader"
    case .some(.connectionTokenProviderCompletedWithError): name = "connectionTokenProviderCompletedWithError"
    case .some(.bluetoothConnectTimedOut): name = "bluetoothConnectTimedOut"
    case .some(.tapToPayUnsupportedDevice): name = "tapToPayUnsupportedDevice"
    case .some(.tapToPayUnsupportedOperatingSystemVersion): name = "tapToPayUnsupportedOperatingSystemVersion"
    default: name = "sdk_\(nsError.code)"
    }
    return ["code": name, "message": nsError.localizedDescription]
  }

  static func paymentStatus(_ status: PaymentStatus) -> String {
    switch status {
    case .notReady: return "notReady"
    case .ready: return "ready"
    case .waitingForInput: return "waitingForInput"
    case .processing: return "processing"
    @unknown default: return "sdk_\(status.rawValue)"
    }
  }

  static func intentStatus(_ status: PaymentIntentStatus) -> String {
    switch status {
    case .requiresPaymentMethod: return "requiresPaymentMethod"
    case .requiresConfirmation: return "requiresConfirmation"
    case .requiresCapture: return "requiresCapture"
    case .processing: return "processing"
    case .canceled: return "canceled"
    case .succeeded: return "succeeded"
    @unknown default: return "sdk_\(status.rawValue)"
    }
  }

  static func reader(_ reader: Reader) -> [String: Any] {
    let deviceType =
      reader.deviceType == .tapToPay ? "tapToPay" : Terminal.stringFromDeviceType(reader.deviceType)
    return ["serialNumber": reader.serialNumber, "deviceType": deviceType]
  }
}
