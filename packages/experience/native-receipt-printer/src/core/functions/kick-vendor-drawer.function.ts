/**
 * Stackra file contract:
 * Purpose: `kickVendorDrawer`, which pulses the drawer wired to a vendor's printer on a pin through the module.
 * Boundary: internal; not exported from the entry. It sends the pulse only: the readiness check before a kick is the
 *           drawer's (`kickThroughPrinter`, ADR 0458 decision 3), so a status is not read twice. A kick is one-way:
 *           success means the SDK took the pulse, not that the drawer opened. No module, no target or a rejected call
 *           refuses with capability `print`.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0253 (decision 4).
 */
import type { DrawerPin } from "@stackra/peripherals/contracts";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { receiptPrinterModule } from "#core/functions/receipt-printer-module.function";
import { refuse } from "#core/functions/refuse.function";
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/**
 * Pulses `pin` on the vendor's printer at `target`.
 *
 * @example
 * const kicked = await kickVendorDrawer(RECEIPT_PRINTER_VENDORS.star, "10.0.0.20", 2);
 */
export async function kickVendorDrawer(
  vendor: ReceiptPrinterVendor,
  target: string | undefined,
  pin: DrawerPin,
): Promise<CapabilityResult> {
  const module = receiptPrinterModule();
  if (module === undefined || target === undefined)
    return refuse(PlatformCapability.Print, "unavailable");
  try {
    await module.kickDrawer(vendor.name, target, pin);
    return { ok: true, data: undefined };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
