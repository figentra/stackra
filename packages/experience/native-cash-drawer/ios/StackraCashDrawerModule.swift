// Stackra file contract:
// Purpose: the iOS half of the `StackraCashDrawer` Expo module: `status` and `open`, which reject on iOS because no
//          drawer port family runs there, so the Sunmi and PAX drivers refuse (`print`) on an iPhone or iPad.
// Boundary: a pass-through with nothing to pass to. A drawer on an Epson or Star printer opens through the receipt
//           printer module (`printer_kick`), never here.
// Runtime: ios
// Governing contract: ADR 0478 (decisions 2 and 5).
import ExpoModulesCore

/// The cash drawer module on iOS.
public final class StackraCashDrawerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StackraCashDrawer")

    AsyncFunction("status") { (vendor: String) throws -> Int in
      throw DrawerNotLinkedException(vendor)
    }

    AsyncFunction("open") { (vendor: String) throws in
      throw DrawerNotLinkedException(vendor)
    }
  }
}

/// A drawer port family iOS does not have.
final class DrawerNotLinkedException: GenericException<String> {
  override var reason: String {
    "iOS has no \(param) drawer port"
  }
}
