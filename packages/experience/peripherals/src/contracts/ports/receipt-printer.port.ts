/**
 * Stackra file contract:
 * Purpose: the `ReceiptPrinter` port: the POS kit's receipt printer (ADR 0253). It prints a receipt, pulses the cash
 *          drawer wired to it, and answers a probe, each as a `CapabilityResult` that refuses with capability `print`
 *          when no printer answers instead of throwing. Config `peripherals.printer` picks the driver (`escpos`,
 *          `memory`).
 * Boundary: an abstract class that is its own token, keyed `peripherals.ReceiptPrinter`; a driver implements it with
 *           `extends Driver(ReceiptPrinter)`. The renderer reaches it only through `PrintReceiptBridge` in main. This
 *           leaf entry imports no other entry of the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1, 2 and 4); ADR 0250 (decision 3: a typed refusal, not a crash); ADR 0294
 *                     (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";

/**
 * The receipt printer.
 *
 * @example
 * const printed = await printer.print({ orderId, lines: ["Total 12.00"] });
 * if (!printed.ok) toast.warning(t(I18n.console.capabilities[printed.error.code]));
 */
export abstract class ReceiptPrinter extends Port {
  /** Type-only port key, so `DriverName<ReceiptPrinter>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.ReceiptPrinter";

  /** Whether a printer answers now; refuses with `unavailable` (or `permission_denied`) otherwise. */
  abstract probe(): Promise<CapabilityResult>;

  /** Prints the receipt and cuts the paper. */
  abstract print(receipt: Receipt): Promise<CapabilityResult<PrintedReceipt>>;

  /** Pulses the drawer wired to the printer's drawer connector on `pin`. */
  abstract kickDrawer(pin: DrawerPin): Promise<CapabilityResult>;
}
