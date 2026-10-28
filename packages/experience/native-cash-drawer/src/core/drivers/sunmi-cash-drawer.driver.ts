/**
 * Stackra file contract:
 * Purpose: `SunmiCashDrawerDriver`, the `CashDrawer` driver of the drawer on the built-in drawer port of Sunmi Android
 *          terminals (T2, V2 class) (`peripherals.drawer: "sunmi"`): it opens the drawer through the package's
 *          `StackraCashDrawer` module. Moved here from `@stackra/peripherals/native` (ADR 0478 decision 5).
 * Boundary: delivers only, through the package's shared functions; it refuses with capability `print` where the module
 *           is absent (iOS, web, a build whose runway does not list `device:sunmi`) or the printer that drives the drawer
 *           is not ready, checked before every kick. A kick is one-way. Certification pending: built from the vendor's
 *           public SDK documents (ADR 0458).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decisions 3 and 5); ADR 0253 (decision 4); ADR 0250
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";
import { CashDrawer } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CASH_DRAWER_VENDORS } from "#core/constants/cash-drawer-vendors.constant";
import { openVendorDrawer } from "#core/functions/open-vendor-drawer.function";
import { probeVendorDrawer } from "#core/functions/probe-vendor-drawer.function";

/**
 * The cash drawer on the Sunmi terminal's drawer port.
 *
 * @example
 * // generated native wiring, android target with `device:sunmi`
 * { port: CashDrawer, selectedBy: "config:peripherals.drawer", candidates: { sunmi: () => import("@stackra/native-cash-drawer").then((m) => m.SunmiCashDrawerDriver) } }
 */
export class SunmiCashDrawerDriver extends Driver(CashDrawer) {
  /** Answers while the printer that drives the drawer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeVendorDrawer(CASH_DRAWER_VENDORS.sunmi);
  }

  /** Opens the drawer after the readiness check. */
  async open(): Promise<CapabilityResult> {
    return openVendorDrawer(CASH_DRAWER_VENDORS.sunmi);
  }
}
