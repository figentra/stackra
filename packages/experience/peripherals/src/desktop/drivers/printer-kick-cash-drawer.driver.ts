/**
 * Stackra file contract:
 * Purpose: `PrinterKickCashDrawerDriver`, the `CashDrawer` driver that opens the drawer through the receipt printer
 *          it is wired to (`peripherals.drawer: "printer_kick"`): a pulse on `peripherals.drawerPin`.
 * Boundary: it touches no device itself; it asks the bound `ReceiptPrinter`, so it works with whichever printer driver
 *           the wiring picked and refuses exactly as that printer does.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the drawer kicks through the printer); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { PeripheralsConfig } from "#config/peripherals.config";
import { CashDrawer } from "#contracts/ports/cash-drawer.port";
import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";

/**
 * A cash drawer on the printer's drawer connector.
 *
 * @example
 * const drawer = new PrinterKickCashDrawerDriver(printer, config);
 * await drawer.open(); // the printer pulses pin 2
 */
export class PrinterKickCashDrawerDriver extends Driver(CashDrawer) {
  /** The printer the drawer is wired to. */
  private readonly printer: ReceiptPrinter;

  /** The peripherals configuration, for the pin. */
  private readonly config: PeripheralsConfig;

  /**
   * @param printer - the bound receipt printer.
   * @param config - the peripherals configuration.
   */
  constructor(printer: ReceiptPrinter, config: PeripheralsConfig) {
    super();
    this.printer = printer;
    this.config = config;
  }

  /** The printer's probe: the drawer answers when its printer does. */
  async probe(): Promise<CapabilityResult> {
    return this.printer.probe();
  }

  /** Pulses the configured pin through the printer. */
  async open(): Promise<CapabilityResult> {
    return this.printer.kickDrawer(this.config.drawerPin);
  }
}
