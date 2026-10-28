/**
 * Stackra file contract:
 * Purpose: `EpsonReceiptPrinterDriver`, the `ReceiptPrinter` driver of a Epson network receipt printer in an Expo app
 *          (`peripherals.printer: "epson"`): it prints and pulses the drawer through the package's
 *          `StackraReceiptPrinter` module at `peripherals.printerAddress` (`tcp://<host>:<port>`).
 * Boundary: delivers only, through the package's shared functions; it refuses with capability `print` where the module
 *           is absent, the address is not a network address, or the printer is not ready. `kickDrawer` sends the
 *           pulse only (the drawer's `printer_kick` probes first). Certification pending: built from the vendor's
 *           public SDK documents (Epson ePOS SDK).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { PeripheralsConfig } from "@stackra/peripherals";
import type { DrawerPin, PrintedReceipt, Receipt } from "@stackra/peripherals/contracts";
import { ReceiptPrinter } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { kickVendorDrawer } from "#core/functions/kick-vendor-drawer.function";
import { printVendorReceipt } from "#core/functions/print-vendor-receipt.function";
import { printerTarget } from "#core/functions/printer-target.function";
import { probeVendorPrinter } from "#core/functions/probe-vendor-printer.function";

/** The Epson family. */
const VENDOR = RECEIPT_PRINTER_VENDORS.epson;

/**
 * A Epson receipt printer on the network.
 *
 * @example
 * // generated native wiring, a target whose runway lists `device:epson`
 * { port: ReceiptPrinter, selectedBy: "config:peripherals.printer", candidates: { epson: () => import("@stackra/native-receipt-printer").then((m) => m.EpsonReceiptPrinterDriver) } }
 */
export class EpsonReceiptPrinterDriver extends Driver(ReceiptPrinter) {
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
    return probeVendorPrinter(VENDOR, this.target());
  }

  /** Prints the receipt as text and cuts. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    return printVendorReceipt(VENDOR, this.target(), receipt);
  }

  /** Pulses the drawer connector on `pin`. */
  async kickDrawer(pin: DrawerPin): Promise<CapabilityResult> {
    return kickVendorDrawer(VENDOR, this.target(), pin);
  }

  /** The SDK target of the configured address, or `undefined` when it is not a network address. */
  private target(): string | undefined {
    return printerTarget(VENDOR, this.config.printerAddress);
  }
}
