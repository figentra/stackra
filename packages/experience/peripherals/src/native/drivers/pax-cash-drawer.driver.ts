/**
 * Stackra file contract:
 * Purpose: `PaxCashDrawerDriver`, the `CashDrawer` driver of the native Android till on PAX Android terminals with a printer (A920 class)
 *          (`peripherals.drawer: "pax"`): it opens the drawer wired to the terminal through the app's
 *          `StackraPax` Expo module.
 * Boundary: delivers only; it refuses with capability `print` where the module is absent or the printer that drives
 *           the drawer is not ready. A kick is one-way. Certification pending: built from the vendor's public SDK
 *           documents (ADR 0459).
 * Runtime: isomorphic
 * Governing contract: ADR 0459 (PAX SDK); ADR 0442 (decision 4); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CashDrawer } from "#contracts/ports/cash-drawer.port";
import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { openNativeDrawer } from "#native/functions/open-native-drawer.function";
import { probeNativePrinter } from "#native/functions/probe-native-printer.function";

/**
 * The cash drawer on the PAX terminal's drawer port.
 *
 * @example
 * // generated native wiring, android target with `device:pax`
 * { port: CashDrawer, selectedBy: "config:peripherals.drawer", candidates: { pax: () => import("@stackra/peripherals/native").then((m) => m.PaxCashDrawerDriver) } }
 */
export class PaxCashDrawerDriver extends Driver(CashDrawer) {
  /** Answers while the printer that drives the drawer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeNativePrinter(POS_DEVICE_FAMILIES.pax);
  }

  /** Opens the drawer. */
  async open(): Promise<CapabilityResult> {
    return openNativeDrawer(POS_DEVICE_FAMILIES.pax);
  }
}
