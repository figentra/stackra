// Stackra file contract:
// Purpose: the Star family of the `StackraReceiptPrinter` module on iOS: a pass-through to Star's StarXpand SDK
//          (`StarIO10`) on a LAN target (the printer's host).
// Boundary: compiled only when the runway lists `device:star`. It returns `StarPrinterStatus.hasError` as 1 or 0,
//           prints text with a partial cut, and opens drawer channel 1 for pin 2 and channel 2 for pin 5. One
//           connection per call, closed after it.
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0253 (decision 4).
import StarIO10

/// Star StarXpand, passed through.
struct StarPrinter: VendorPrinter {
  func status(target: String) async throws -> Int {
    try await opened(target) { printer in try await printer.getStatus().hasError ? 1 : 0 }
  }

  func printLines(target: String, lines: [String]) async throws {
    try await opened(target) { printer in
      let page = StarXpandCommand.PrinterBuilder()
      for line in lines { _ = page.actionPrintText(line + "\n") }
      _ = page.actionCut(.partial)
      let commands = StarXpandCommand.StarXpandCommandBuilder()
        .addDocument(StarXpandCommand.DocumentBuilder().addPrinter(page))
        .getCommands()
      try await printer.print(command: commands)
    }
  }

  func kickDrawer(target: String, pin: Int) async throws {
    try await opened(target) { printer in
      let channel: StarXpandCommand.Drawer.Channel = pin == 5 ? .no2 : .no1
      let drawer = StarXpandCommand.DrawerBuilder()
        .actionOpen(StarXpandCommand.Drawer.OpenParameter().setChannel(channel))
      let commands = StarXpandCommand.StarXpandCommandBuilder()
        .addDocument(StarXpandCommand.DocumentBuilder().addDrawer(drawer))
        .getCommands()
      try await printer.print(command: commands)
    }
  }

  /// Runs `block` on a printer opened at `target`, then closes it.
  private func opened<T>(_ target: String, _ block: (StarIO10.StarPrinter) async throws -> T) async throws -> T {
    let printer = StarIO10.StarPrinter(StarConnectionSettings(interfaceType: .lan, identifier: target))
    try await printer.open()
    do {
      let answer = try await block(printer)
      await printer.close()
      return answer
    } catch {
      await printer.close()
      throw error
    }
  }
}
