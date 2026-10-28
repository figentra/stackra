/**
 * Stackra file contract:
 * Purpose: `PaxReceiptPrinterDriver`, the `ReceiptPrinter` driver of the built-in printer of PAX Android terminals
 *          (A920 class) (`peripherals.printer: "pax"`): it prints and pulses the drawer wired to the terminal through the
 *          package's `StackraReceiptPrinter` module. Moved here from `@stackra/peripherals/native` (ADR 0478
 *          decision 5).
 * Boundary: delivers only, through the package's shared functions; it refuses with capability `print` where the module
 *           is absent (iOS, web, a build whose runway does not list `device:pax`) or the printer is not ready. The
 *           vendor's drawer call takes no pin, so `kickDrawer` passes it and the SDK ignores it. Certification pending:
 *           built from the vendor's public SDK documents (ADR 0459).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0459 (decisions 3 to 5); ADR 0253 (decision 4); ADR 0250
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";
import type { DrawerPin, PrintedReceipt, Receipt } from "@stackra/peripherals/contracts";
import { ReceiptPrinter } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { kickVendorDrawer } from "#core/functions/kick-vendor-drawer.function";
import { printVendorReceipt } from "#core/functions/print-vendor-receipt.function";
import { probeVendorPrinter } from "#core/functions/probe-vendor-printer.function";

/** The PAX family; a built-in printer has an empty target. */
const VENDOR = RECEIPT_PRINTER_VENDORS.pax;

/**
 * The PAX terminal's built-in receipt printer.
 *
 * @example
 * // generated native wiring, android target with `device:pax`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { pax: () => import("@stackra/native-receipt-printer").then((m) => m.PaxReceiptPrinterDriver) } }
 */
export class PaxReceiptPrinterDriver extends Driver(ReceiptPrinter) {
  /** Answers while the printer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeVendorPrinter(VENDOR, "");
  }

  /** Prints the receipt as text and cuts where the model has a cutter. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    return printVendorReceipt(VENDOR, "", receipt);
  }

  /** Pulses the drawer wired to the terminal; the SDK has one drawer port, so `pin` is not used by it. */
  async kickDrawer(pin: DrawerPin): Promise<CapabilityResult> {
    return kickVendorDrawer(VENDOR, "", pin);
  }
}
