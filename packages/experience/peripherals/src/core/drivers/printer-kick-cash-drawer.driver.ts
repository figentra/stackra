/**
 * Stackra file contract:
 * Purpose: `PrinterKickCashDrawerDriver`, the `CashDrawer` driver that opens the drawer through the receipt printer
 *          it is wired to (`peripherals.drawer: "printer_kick"`): a pulse on `peripherals.drawerPin`.
 * Boundary: it touches no device itself; it asks the bound `ReceiptPrinter`, so it works with whichever printer driver
 *           the wiring picked (ESC/POS on a desktop, a native module package's on an Expo app) and refuses exactly as
 *           that printer does. It lives in the core entry, which every runtime can load, so desktop and Expo apps share
 *           this one `printer_kick` driver (ADR 0478 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the drawer kicks through the printer); ADR 0250 (decision 3); ADR 0458
 *                     (decision 3: a kick checks readiness first); ADR 0478 (decision 5).
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

  /** Probes the printer, then pulses the configured pin through it only when it is ready (ADR 0458 decision 3). */
  async open(): Promise<CapabilityResult> {
    const ready = await this.printer.probe();
    if (!ready.ok) return ready;
    return this.printer.kickDrawer(this.config.drawerPin);
  }
}
