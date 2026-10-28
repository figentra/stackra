// Stackra file contract:
// Purpose: the Epson family of the `StackraReceiptPrinter` module on iOS: a pass-through to Epson's ePOS SDK
//          (`Epos2Printer`) on a network target (`TCP:<host>`).
// Boundary: compiled only when the runway lists `device:epson`. It returns `Epos2PrinterStatusInfo.online` as the
//           status, prints text with a feed cut, and pulses `EPOS2_DRAWER_2PIN` or `EPOS2_DRAWER_5PIN`. One connection
//           per call, closed after it. The series is the generic TM-T88 class (a certification row, STA-739).
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0253 (decision 4).
import Foundation
import libepos2

/// Epson ePOS, passed through.
struct EpsonPrinter: VendorPrinter {
  func status(target: String) async throws -> Int {
    try await connected(target) { printer in Int(printer.getStatus().getOnline()) }
  }

  func printLines(target: String, lines: [String]) async throws {
    try await connected(target) { printer in
      for line in lines { try check(printer.addText(line + "\n")) }
      try check(printer.addCut(EPOS2_CUT_FEED.rawValue))
      try await send(printer)
    }
  }

  func kickDrawer(target: String, pin: Int) async throws {
    try await connected(target) { printer in
      let drawer = pin == 5 ? EPOS2_DRAWER_5PIN : EPOS2_DRAWER_2PIN
      try check(printer.addPulse(drawer.rawValue, time: EPOS2_PULSE_100.rawValue))
      try await send(printer)
    }
  }

  /// Runs `block` on a printer connected to `target`, then disconnects.
  private func connected<T>(_ target: String, _ block: (Epos2Printer) async throws -> T) async throws -> T {
    guard let printer = Epos2Printer(printerSeries: EPOS2_TM_T88.rawValue, lang: EPOS2_MODEL_ANK.rawValue) else {
      throw EpsonException(Int32(EPOS2_ERR_MEMORY.rawValue))
    }
    try check(printer.connect(target, timeout: Int(EPOS2_PARAM_DEFAULT)))
    defer {
      printer.clearCommandBuffer()
      printer.disconnect()
    }
    return try await block(printer)
  }

  /// Sends the buffer and waits for the printer's answer; a code other than success throws.
  private func send(_ printer: Epos2Printer) async throws {
    let receiver = EpsonReceiver()
    printer.setReceiveEventDelegate(receiver)
    let code: Int32 = await withCheckedContinuation { continuation in
      receiver.resume = { code in continuation.resume(returning: code) }
      let sent = printer.sendData(Int(EPOS2_PARAM_DEFAULT))
      if sent != EPOS2_SUCCESS.rawValue { receiver.finish(sent) }
    }
    withExtendedLifetime(receiver) {}  // the SDK holds its delegate weakly
    if code != EPOS2_CODE_SUCCESS.rawValue { throw EpsonException(code) }
  }

  /// Throws on an SDK result other than success.
  private func check(_ result: Int32) throws {
    if result != EPOS2_SUCCESS.rawValue { throw EpsonException(result) }
  }
}

/// The delegate that hands the printer's answer to one waiting send, once.
private final class EpsonReceiver: NSObject, Epos2PtrReceiveDelegate, @unchecked Sendable {
  /// The waiting send's continuation, until it is resumed.
  var resume: ((Int32) -> Void)?

  func onPtrReceive(_ printerObj: Epos2Printer!, code: Int32, status: Epos2PrinterStatusInfo!, printJobId: String!) {
    finish(code)
  }

  func finish(_ code: Int32) {
    resume?(code)
    resume = nil
  }
}

/// An Epson SDK result other than success.
struct EpsonException: Error {
  let code: Int32
  init(_ code: Int32) { self.code = code }
}
