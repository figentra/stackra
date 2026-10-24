/**
 * Stackra file contract:
 * Purpose: `MemoryReceiptPrinterDriver`, the `ReceiptPrinter` driver that prints into memory: the `memory` candidate
 *          (`peripherals.printer: "memory"`), the driver of tests, of a web build and of a till with no printer yet.
 * Boundary: no device is touched. `printed` and `kicks` record each job and each drawer pulse in order; a test sets
 *           `isPresent = false` to see the refusal a missing printer gives. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A receipt printer in memory.
 *
 * @example
 * const printer = new MemoryReceiptPrinterDriver();
 * await printer.print({ orderId: "ord_1", lines: ["Total 12.00"] }); // { ok: true, data: { printer: "memory", orderId: "ord_1" } }
 * printer.printed; // [{ orderId: "ord_1", lines: ["Total 12.00"] }]
 */
export class MemoryReceiptPrinterDriver extends Driver(ReceiptPrinter) {
  /** Whether the printer answers; false makes every call refuse with `unavailable`. */
  isPresent = true;

  /** Every receipt printed, in order. */
  readonly printed: Receipt[] = [];

  /** Every drawer pulse, by pin, in order. */
  readonly kicks: DrawerPin[] = [];

  /** Answers while present. */
  async probe(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Records the receipt. */
  async print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    this.printed.push(receipt);
    return { ok: true, data: { printer: "memory", orderId: receipt.orderId } };
  }

  /** Records the pulse. */
  async kickDrawer(pin: DrawerPin): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    this.kicks.push(pin);
    return { ok: true, data: undefined };
  }
}
