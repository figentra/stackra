/**
 * Stackra file contract:
 * Purpose: the `KitchenPrinter` port: the kitchen ticket printers, one or more per station. It prints a ticket on the
 *          printer of the ticket's station and answers a probe per station, each as a `CapabilityResult` that refuses
 *          with capability `print` when no printer answers instead of throwing.
 * Boundary: an abstract class that is its own token, keyed `peripherals.KitchenPrinter`; a driver implements it with
 *           `extends Driver(KitchenPrinter)`. Not the `ReceiptPrinter`: no drawer, and it routes by station.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1, 2 and 4); ADR 0250 (decision 3); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { KitchenTicket } from "#contracts/types/kitchen-ticket.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";

/**
 * The kitchen ticket printers.
 *
 * @example
 * const printed = await kitchen.print({ orderId, station: "grill", lines: ["2x Shawarma"] });
 */
export abstract class KitchenPrinter extends Port {
  /** Type-only port key, so `DriverName<KitchenPrinter>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.KitchenPrinter";

  /** Whether the printer of `station` answers now. */
  abstract probe(station: string): Promise<CapabilityResult>;

  /** Prints `ticket` on its station's printer and cuts the paper. */
  abstract print(ticket: KitchenTicket): Promise<CapabilityResult<PrintedReceipt>>;
}
