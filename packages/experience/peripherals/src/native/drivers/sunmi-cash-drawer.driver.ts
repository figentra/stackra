/**
 * Stackra file contract:
 * Purpose: `SunmiCashDrawerDriver`, the `CashDrawer` driver of the native Android till on Sunmi Android terminals (T2, V2 class)
 *          (`peripherals.drawer: "sunmi"`): it opens the drawer wired to the terminal through the app's
 *          `StackraSunmi` Expo module.
 * Boundary: delivers only; it refuses with capability `print` where the module is absent or the printer that drives
 *           the drawer is not ready. A kick is one-way. Certification pending: built from the vendor's public SDK
 *           documents (ADR 0458).
 * Runtime: isomorphic
 * Governing contract: ADR 0458 (Sunmi SDK); ADR 0442 (decision 4); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CashDrawer } from "#contracts/ports/cash-drawer.port";
import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { openNativeDrawer } from "#native/functions/open-native-drawer.function";
import { probeNativePrinter } from "#native/functions/probe-native-printer.function";

/**
 * The cash drawer on the Sunmi terminal's drawer port.
 *
 * @example
 * // generated native wiring, android target with `device:sunmi`
 * { port: CashDrawer, selectedBy: "config:peripherals.drawer", candidates: { sunmi: () => import("@stackra/peripherals/native").then((m) => m.SunmiCashDrawerDriver) } }
 */
export class SunmiCashDrawerDriver extends Driver(CashDrawer) {
  /** Answers while the printer that drives the drawer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeNativePrinter(POS_DEVICE_FAMILIES.sunmi);
  }

  /** Opens the drawer. */
  async open(): Promise<CapabilityResult> {
    return openNativeDrawer(POS_DEVICE_FAMILIES.sunmi);
  }
}
