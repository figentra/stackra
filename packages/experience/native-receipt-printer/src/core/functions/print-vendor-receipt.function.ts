/**
 * Stackra file contract:
 * Purpose: `printVendorReceipt`, which prints a receipt on a vendor's printer: it checks the printer is ready, then
 *          hands the lines to the module as text.
 * Boundary: internal; not exported from the entry. Lines are text, never printer commands: control characters are
 *           dropped, so a line cannot reach the drawer or the cutter. Every other Unicode character is kept, because
 *           the vendor SDK draws the text (Arabic shaping is the SDK font's, a certification row). A failed call
 *           refuses with capability `print`. `printer` in the answer is the vendor's name, never the address.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 4); ADR 0459 (decision 4); ADR 0253 (decision 4).
 */
import type { PrintedReceipt, Receipt } from "@stackra/peripherals/contracts";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { probeVendorPrinter } from "#core/functions/probe-vendor-printer.function";
import { receiptPrinterModule } from "#core/functions/receipt-printer-module.function";
import { refuse } from "#core/functions/refuse.function";
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/** Every control character (C0, DEL and C1). */
const CONTROL = /\p{Cc}/gu;

/**
 * Prints `receipt` on the vendor's printer at `target`.
 *
 * @example
 * const printed = await printVendorReceipt(RECEIPT_PRINTER_VENDORS.sunmi, "", { orderId, lines });
 */
export async function printVendorReceipt(
  vendor: ReceiptPrinterVendor,
  target: string | undefined,
  receipt: Receipt,
): Promise<CapabilityResult<PrintedReceipt>> {
  const ready = await probeVendorPrinter(vendor, target);
  if (!ready.ok) return ready;
  try {
    await receiptPrinterModule()?.printLines(
      vendor.name,
      target ?? "",
      receipt.lines.map((line) => line.replace(CONTROL, "")),
    );
    return { ok: true, data: { printer: vendor.name, orderId: receipt.orderId } };
  } catch {
    return refuse(PlatformCapability.Print, "unavailable");
  }
}
