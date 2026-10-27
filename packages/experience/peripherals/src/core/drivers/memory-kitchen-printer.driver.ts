/**
 * Stackra file contract:
 * Purpose: `MemoryKitchenPrinterDriver`, the `KitchenPrinter` driver that records each ticket it is given: the default
 *          candidate, so a kitchen's routing and a KDS test run with no printer.
 * Boundary: no device is touched. It serves every station; `isPresent = false` makes every call refuse with capability
 *           `print`. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 and 4); ADR 0266 (memory drivers first); ADR 0269 (fakes are real
 *                     drivers); ADR 0449 (decision 1).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { KitchenPrinter } from "#contracts/ports/kitchen-printer.port";
import type { KitchenTicket } from "#contracts/types/kitchen-ticket.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * Kitchen printers in memory.
 *
 * @example
 * const kitchen = new MemoryKitchenPrinterDriver();
 * await kitchen.print({ orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] }); // printer "memory"
 * kitchen.printed; // [{ orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] }]
 */
export class MemoryKitchenPrinterDriver extends Driver(KitchenPrinter) {
  /** Every ticket printed, in order. */
  readonly printed: KitchenTicket[] = [];

  /** Whether the printers answer; false makes every call refuse with `unavailable`. */
  isPresent = true;

  /** Answers while present, for any station. */
  async probe(_station: string): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Records the ticket. */
  async print(ticket: KitchenTicket): Promise<CapabilityResult<PrintedReceipt>> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    this.printed.push(ticket);
    return { ok: true, data: { printer: "memory", orderId: ticket.orderId } };
  }
}
