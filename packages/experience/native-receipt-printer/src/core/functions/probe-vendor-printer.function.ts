/**
 * Stackra file contract:
 * Purpose: `probeVendorPrinter`, which asks a vendor's printer for its status through the module and answers ready
 *          only on one of the vendor's `printerReady` codes.
 * Boundary: internal; not exported from the entry. Every other outcome (no module, no target, another status, a
 *           rejected call) refuses with capability `print`, never a thrown error at the till. The status number is not
 *           put in the refusal: the two refusal codes are the whole set (ADR 0250 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0459 (decision 3); ADR 0250 (decision 3).
 */
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { receiptPrinterModule } from "#core/functions/receipt-printer-module.function";
import { refuse } from "#core/functions/refuse.function";
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/**
 * Whether the vendor's printer at `target` is ready now.
 *
 * @example
 * const ready = await probeVendorPrinter(RECEIPT_PRINTER_VENDORS.pax, "");
 */
export async function probeVendorPrinter(
  vendor: ReceiptPrinterVendor,
  target: string | undefined,
): Promise<CapabilityResult> {
  const module = receiptPrinterModule();
  if (module === undefined || target === undefined)
    return refuse(PlatformCapability.Print, "unavailable");
  try {
    const status = await module.status(vendor.name, target);
    if (!vendor.printerReady.includes(status))
      return refuse(PlatformCapability.Print, "unavailable");
    return { ok: true, data: undefined };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
