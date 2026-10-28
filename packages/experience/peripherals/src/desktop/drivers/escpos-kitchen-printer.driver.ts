/**
 * Stackra file contract:
 * Purpose: `EscposKitchenPrinterDriver`, the `KitchenPrinter` driver of the desktop main process
 *          (`peripherals.kitchenPrinter: "escpos"`): it finds the named printer of `peripherals.kitchenPrinters` that
 *          serves the ticket's station, sends it the ticket as ESC/POS (raster when the ticket carries one, so Arabic
 *          prints shaped) and sounds that printer's buzzer when it has one.
 * Boundary: main only, with no native module (ADR 0253 decision 3); it sends through `sendToPrinter`, as the receipt
 *           driver does. A station no printer serves, a refused connection or a timeout resolves `unavailable`;
 *           `EACCES` or `EPERM` resolves `permission_denied`. The printed result names the printer by its configured
 *           name. Which items go to which station is the product's routing, not this driver's.
 * Runtime: node
 * Governing contract: ADR 0339 (decisions 2 and 5); ADR 0253 (decisions 2 to 4); ADR 0250 (decision 3); ADR 0449
 *                     (decision 1).
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { PeripheralsConfig } from "#config/peripherals.config";
import { KitchenPrinter } from "#contracts/ports/kitchen-printer.port";
import type { KitchenTicket } from "#contracts/types/kitchen-ticket.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import { escposKitchenTicket } from "#core/functions/escpos-kitchen-ticket.function";
import { refuse } from "#core/functions/refuse.function";
import { sendToPrinter } from "#desktop/functions/send-to-printer.function";

/**
 * Named ESC/POS kitchen printers reached from main.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: KitchenPrinter, selectedBy: "config:peripherals.kitchenPrinter", candidates: { escpos: () => import("@stackra/peripherals/desktop").then((m) => m.EscposKitchenPrinterDriver) } }
 */
export class EscposKitchenPrinterDriver extends Driver(KitchenPrinter) {
  /** The peripherals configuration, for the named printers. */
  private readonly config: PeripheralsConfig;

  /**
   * @param config - the peripherals configuration.
   */
  constructor(config: PeripheralsConfig) {
    super();
    this.config = config;
  }

  /** Opens the connection to `station`'s printer and sends nothing. */
  async probe(station: string): Promise<CapabilityResult> {
    const printer = this.printerOf(station);
    if (printer === undefined) return refuse(PlatformCapability.Print, "unavailable");
    return this.send(printer.address, new Uint8Array(0));
  }

  /** Prints the ticket on its station's printer, cuts, and beeps. */
  async print(ticket: KitchenTicket): Promise<CapabilityResult<PrintedReceipt>> {
    const printer = this.printerOf(ticket.station);
    if (printer === undefined) return refuse(PlatformCapability.Print, "unavailable");
    const sent = await this.send(printer.address, escposKitchenTicket(ticket, printer.buzz));
    if (!sent.ok) return sent;
    return { ok: true, data: { printer: printer.name, orderId: ticket.orderId } };
  }

  /** The named printer that serves `station`. */
  private printerOf(
    station: string,
  ): (PeripheralsConfig["kitchenPrinters"][string] & { name: string }) | undefined {
    for (const [name, printer] of Object.entries(this.config.kitchenPrinters))
      if (printer.stations.includes(station)) return { ...printer, name };
    return undefined;
  }

  /** Sends `bytes` to `address`, as a result. */
  private async send(address: string, bytes: Uint8Array): Promise<CapabilityResult> {
    try {
      await sendToPrinter(address, bytes);
      return { ok: true, data: undefined };
    } catch (error) {
      const code = (error as { readonly code?: unknown }).code;
      return refuse(
        PlatformCapability.Print,
        code === "EACCES" || code === "EPERM" ? "permission_denied" : "unavailable",
      );
    }
  }
}
