/**
 * Stackra file contract:
 * Purpose: `PrinterKickCashDrawerDriver`, the `CashDrawer` driver of an Expo app whose drawer is wired to the receipt
 *          printer (`peripherals.drawer: "printer_kick"`): it probes the bound `ReceiptPrinter` and pulses
 *          `peripherals.drawerPin` through it, with @stackra/native-receipt-printer's `kickThroughPrinter`.
 * Boundary: it touches no device itself, so it works with whichever printer driver the wiring picked (`epson`, `star`,
 *           `sunmi`, `pax`, `memory`) and refuses exactly as that printer does. The readiness check comes before every
 *           kick (ADR 0458 decision 3); the kick is one-way. The native counterpart of `@stackra/peripherals/desktop`'s
 *           driver of the same name, so one runway value serves both targets.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0253 (decision 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import { kickThroughPrinter } from "@stackra/native-receipt-printer";
import type { PeripheralsConfig } from "@stackra/peripherals";
import type { ReceiptPrinter } from "@stackra/peripherals/contracts";
import { CashDrawer } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

/**
 * A cash drawer on the receipt printer's drawer connector.
 *
 * @example
 * // generated native wiring
 * { port: CashDrawer, selectedBy: "config:peripherals.drawer", candidates: { printer_kick: () => import("@stackra/native-cash-drawer").then((m) => m.PrinterKickCashDrawerDriver) } }
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

  /** Probes the printer, then pulses the configured pin through it. */
  async open(): Promise<CapabilityResult> {
    return kickThroughPrinter(this.printer, this.config.drawerPin);
  }
}
