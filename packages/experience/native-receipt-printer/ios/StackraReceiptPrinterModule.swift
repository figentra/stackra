// Stackra file contract:
// Purpose: the iOS half of the `StackraReceiptPrinter` Expo module: `status`, `printLines` and `kickDrawer`, each
//          handed to the named vendor family's `VendorPrinter` (Epson and Star; Sunmi and PAX are Android terminals).
// Boundary: a pass-through. A family is compiled only when the runway lists it (the podspec sets its compilation
//           condition), so a family the build does not link rejects. It decides nothing: readiness and refusals are
//           the TypeScript driver's.
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2 and 5).
import ExpoModulesCore

/// The receipt printer module.
public final class StackraReceiptPrinterModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StackraReceiptPrinter")

    AsyncFunction("status") { (vendor: String, target: String) async throws -> Int in
      try await Self.printer(vendor).status(target: target)
    }

    AsyncFunction("printLines") { (vendor: String, target: String, lines: [String]) async throws in
      try await Self.printer(vendor).printLines(target: target, lines: lines)
    }

    AsyncFunction("kickDrawer") { (vendor: String, target: String, pin: Int) async throws in
      try await Self.printer(vendor).kickDrawer(target: target, pin: pin)
    }
  }

  /// The family's printer, or a rejection when the build does not link it.
  private static func printer(_ vendor: String) throws -> VendorPrinter {
    switch vendor {
    #if STACKRA_EPSON
    case "epson": return EpsonPrinter()
    #endif
    #if STACKRA_STAR
    case "star": return StarPrinter()
    #endif
    default: throw VendorNotLinkedException(vendor)
    }
  }
}

/// A family this build does not link.
final class VendorNotLinkedException: GenericException<String> {
  override var reason: String {
    "This build does not link the \(param) printer"
  }
}
