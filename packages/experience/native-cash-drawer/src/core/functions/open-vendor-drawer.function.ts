/**
 * Stackra file contract:
 * Purpose: `openVendorDrawer`, which pulses a terminal family's drawer port after checking the printer that drives it
 *          is ready (ADR 0458 decision 3).
 * Boundary: internal; not exported from the entry. A kick is one-way: success means the SDK took the pulse, not that
 *           the drawer opened. A failed call refuses with capability `print`.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0459 (decision 3); ADR 0253 (decision 4).
 */
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { cashDrawerModule } from "#core/functions/cash-drawer-module.function";
import { probeVendorDrawer } from "#core/functions/probe-vendor-drawer.function";
import { refuse } from "#core/functions/refuse.function";
import type { CashDrawerVendor } from "#core/types/cash-drawer-vendor.type";

/**
 * Opens the family's drawer.
 *
 * @example
 * const opened = await openVendorDrawer(CASH_DRAWER_VENDORS.pax);
 */
export async function openVendorDrawer(vendor: CashDrawerVendor): Promise<CapabilityResult> {
  const ready = await probeVendorDrawer(vendor);
  if (!ready.ok) return ready;
  try {
    await cashDrawerModule()?.open(vendor.name);
    return { ok: true, data: undefined };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
