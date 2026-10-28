/**
 * Stackra file contract:
 * Purpose: `NetworkReceiptPrinterDriver`, the base of the `ReceiptPrinter` drivers of a network receipt printer in an
 *          Expo app (Epson, Star): it prints and pulses the drawer through the package's `StackraReceiptPrinter`
 *          module at `peripherals.printerAddress` (`tcp://<host>:<port>`), for the vendor its subclass names.
 * Boundary: delivers only, through the package's shared functions; it refuses with capability `print` where the module
 *           is absent, the address is not a network address, or the printer is not ready. `kickDrawer` sends the
 *           pulse only (the drawer's `printer_kick` probes first). Internal: the barrel exports the subclasses only.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { PeripheralsConfig } from "@stackra/peripherals";
import type { DrawerPin, PrintedReceipt, Receipt } from "@stackra/peripherals/contracts";
import { ReceiptPrinter } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { kickVendorDrawer } from "#core/functions/kick-vendor-drawer.function";
import { printVendorReceipt } from "#core/functions/print-vendor-receipt.function";
import { printerTarget } from "#core/functions/printer-target.function";
import { probeVendorPrinter } from "#core/functions/probe-vendor-printer.function";
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/**
 * A receipt printer on the network, of the vendor family its subclass names.
 *
 * @example
 * export class EpsonReceiptPrinterDriver extends NetworkReceiptPrinterDriver {
 *   protected override readonly vendor = RECEIPT_PRINTER_VENDORS.epson;
 * }
 */
export abstract class NetworkReceiptPrinterDriver extends Driver(ReceiptPrinter) {
  /** The vendor family, declared by the subclass. */
  protected abstract readonly vendor: ReceiptPrinterVendor;

  /** The peripherals configuration, for the printer's address. */
  private readonly config: PeripheralsConfig;

  /**
   * @param config - the peripherals configuration.
   */
  constructor(config: PeripheralsConfig) {
    super();
    this.config = config;
  }

  /** Answers while the printer reports ready. */
  async probe(): Promise<CapabilityResult> {
    return probeVendorPrinter(this.vendor, this.target());
  }

  /** Prints the receipt as text and cuts. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    return printVendorReceipt(this.vendor, this.target(), receipt);
  }

  /** Pulses the drawer connector on `pin`. */
  async kickDrawer(pin: DrawerPin): Promise<CapabilityResult> {
    return kickVendorDrawer(this.vendor, this.target(), pin);
  }

  /** The SDK target of the configured address, or `undefined` when it is not a network address. */
  private target(): string | undefined {
    return printerTarget(this.vendor, this.config.printerAddress);
  }
}
