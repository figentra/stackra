// Stackra file contract:
// Purpose: `VendorPrinter`, what one vendor family's pass-through does on iOS: read the printer's raw status, print text
//          lines and pulse the drawer, each a direct call to the vendor SDK.
// Boundary: a protocol only. An implementation maps nothing: the status is the SDK's own number (the TypeScript driver
//           reads it through the family's ready codes), lines are text, and an SDK failure is thrown so the module
//           rejects and the driver refuses.
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2 and 5).

/// One vendor family's printer SDK, passed through.
protocol VendorPrinter: Sendable {
  /// The printer's status exactly as the SDK returns it.
  func status(target: String) async throws -> Int

  /// Prints `lines` as text, feeds and cuts.
  func printLines(target: String, lines: [String]) async throws

  /// Pulses the drawer connector on `pin` (2 or 5).
  func kickDrawer(target: String, pin: Int) async throws
}
