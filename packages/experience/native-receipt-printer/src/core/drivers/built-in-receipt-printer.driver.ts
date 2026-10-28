/**
 * Stackra file contract:
 * Purpose: `BuiltInReceiptPrinterDriver`, the base of the `ReceiptPrinter` drivers of the built-in printer of an
 *          Android payment terminal (Sunmi, PAX): it prints and pulses the drawer wired to the terminal through the
 *          package's `StackraReceiptPrinter` module, for the vendor its subclass names.
 * Boundary: delivers only, through the package's shared functions; it refuses with capability `print` where the module
 *           is absent (iOS, web, a build whose runway does not list the vendor's `device:<family>`) or the printer is
 *           not ready. A built-in printer has an empty target. The vendors' drawer calls take no pin, so `kickDrawer`
 *           passes it and the SDK ignores it. Internal: the barrel exports the subclasses only.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 and ADR 0459 (decisions 3 to 5); ADR 0253 (decision 4);
 *                     ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { DrawerPin, PrintedReceipt, Receipt } from "@stackra/peripherals/contracts";
import { ReceiptPrinter } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { kickVendorDrawer } from "#core/functions/kick-vendor-drawer.function";
import { printVendorReceipt } from "#core/functions/print-vendor-receipt.function";
import { probeVendorPrinter } from "#core/functions/probe-vendor-printer.function";
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/**
 * The terminal's built-in receipt printer, of the vendor family its subclass names.
 *
 * @example
 * export class SunmiReceiptPrinterDriver extends BuiltInReceiptPrinterDriver {
 *   protected override readonly vendor = RECEIPT_PRINTER_VENDORS.sunmi;
 * }
 */
export abstract class BuiltInReceiptPrinterDriver extends Driver(ReceiptPrinter) {
  /** The vendor family, declared by the subclass. */
  protected abstract readonly vendor: ReceiptPrinterVendor;

  /** Answers while the printer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeVendorPrinter(this.vendor, "");
  }

  /** Prints the receipt as text and cuts where the model has a cutter. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    return printVendorReceipt(this.vendor, "", receipt);
  }

  /** Pulses the drawer wired to the terminal; the SDK has one drawer port, so `pin` is not used by it. */
  async kickDrawer(pin: DrawerPin): Promise<CapabilityResult> {
    return kickVendorDrawer(this.vendor, "", pin);
  }
}
