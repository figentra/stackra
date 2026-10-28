/**
 * Stackra file contract:
 * Purpose: `PaxCashDrawerDriver`, the `CashDrawer` driver of the drawer on the built-in drawer port of PAX Android
 *          terminals (A920 class) (`peripherals.drawer: "pax"`): it opens the drawer through the package's
 *          `StackraCashDrawer` module. Moved here from `@stackra/peripherals/native` (ADR 0478 decision 5).
 * Boundary: delivers only, through the package's shared functions; it refuses with capability `print` where the module
 *           is absent (iOS, web, a build whose runway does not list `device:pax`) or the printer that drives the drawer
 *           is not ready, checked before every kick. A kick is one-way. Certification pending: built from the vendor's
 *           public SDK documents (ADR 0459).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0459 (decisions 3 and 5); ADR 0253 (decision 4); ADR 0250
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";
import { CashDrawer } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CASH_DRAWER_VENDORS } from "#core/constants/cash-drawer-vendors.constant";
import { openVendorDrawer } from "#core/functions/open-vendor-drawer.function";
import { probeVendorDrawer } from "#core/functions/probe-vendor-drawer.function";

/**
 * The cash drawer on the PAX terminal's drawer port.
 *
 * @example
 * // generated native wiring, android target with `device:pax`
 * { port: CashDrawer, selectedBy: "config:peripherals.drawer", candidates: { pax: () => import("@stackra/native-cash-drawer").then((m) => m.PaxCashDrawerDriver) } }
 */
export class PaxCashDrawerDriver extends Driver(CashDrawer) {
  /** Answers while the printer that drives the drawer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeVendorDrawer(CASH_DRAWER_VENDORS.pax);
  }

  /** Opens the drawer after the readiness check. */
  async open(): Promise<CapabilityResult> {
    return openVendorDrawer(CASH_DRAWER_VENDORS.pax);
  }
}
