// Stackra file contract:
// Purpose: ReaderEvents, the one delegate the module hands Stripe Terminal for discovery, Bluetooth readers and Tap to
//          Pay: it forwards discovered readers to the call waiting on them and ignores the rest (software updates
//          install on connect, and reader prompts show on the reader or the system sheet).
// Boundary: forwards only; no card data, no state beyond the waiting callback. Certification pending (STA-739).
// Runtime: ios
// Governing contract: ADR 0479 (decisions 1 and 2).
import StripeTerminal

final class ReaderEvents: NSObject, DiscoveryDelegate, MobileReaderDelegate, TapToPayReaderDelegate {
  /// The call waiting on discovered readers.
  var onDiscover: (([Reader]) -> Void)?

  func terminal(_ terminal: Terminal, didUpdateDiscoveredReaders readers: [Reader]) {
    onDiscover?(readers)
  }

  // MobileReaderDelegate: updates and prompts are the reader's own.
  func reader(_ reader: Reader, didReportAvailableUpdate update: ReaderSoftwareUpdate) {}
  func reader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {}
  func reader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {}
  func reader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: Error?) {}
  func reader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions = []) {}
  func reader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {}

  // TapToPayReaderDelegate: the system sheet shows its own prompts.
  func tapToPayReader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {}
  func tapToPayReader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {}
  func tapToPayReader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: Error?) {}
  func tapToPayReader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions = []) {}
  func tapToPayReader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {}
}
