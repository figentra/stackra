/**
 * Stackra file contract:
 * Purpose: `probeVendorDrawer`, which asks a terminal family for the status of the printer that drives its drawer port
 *          and answers ready only on one of the family's `printerReady` codes (ADR 0458 decision 3).
 * Boundary: internal; not exported from the entry. Every other outcome (no module, another status, a rejected call)
 *           refuses with capability `print`, never a thrown error at the till; the status number is not put in the
 *           refusal (ADR 0250 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0459 (decision 3); ADR 0250 (decision 3).
 */
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { cashDrawerModule } from "#core/functions/cash-drawer-module.function";
import { refuse } from "#core/functions/refuse.function";
import type { CashDrawerVendor } from "#core/types/cash-drawer-vendor.type";

/**
 * Whether the family's drawer can be reached now.
 *
 * @example
 * const ready = await probeVendorDrawer(CASH_DRAWER_VENDORS.sunmi);
 */
export async function probeVendorDrawer(vendor: CashDrawerVendor): Promise<CapabilityResult> {
  const module = cashDrawerModule();
  if (module === undefined) return refuse(PlatformCapability.Print, "unavailable");
  try {
    const status = await module.status(vendor.name);
    if (!vendor.printerReady.includes(status))
      return refuse(PlatformCapability.Print, "unavailable");
    return { ok: true, data: undefined };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
