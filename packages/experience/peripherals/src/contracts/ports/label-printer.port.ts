/**
 * Stackra file contract:
 * Purpose: the `LabelPrinter` port: the POS kit's label printer (shelf labels, price tickets, shipping labels). It
 *          prints a ZPL or raster label and answers a probe, each as a `CapabilityResult` that refuses with capability
 *          `print` when no printer answers. Config `peripherals.labelPrinter` picks the driver (`zpl`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `peripherals.LabelPrinter`. Which printers are certified is
 *           the product's seed data (a preset entry), not code.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decisions 1, 2, 5 and 7); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { Label } from "#contracts/types/label.type";
import type { PrintedLabel } from "#contracts/types/printed-label.type";

/**
 * The label printer.
 *
 * @example
 * const printed = await labels.print({ jobId, copies: 2, format: LabelFormat.Zpl, zpl });
 * if (!printed.ok) toast.warning(t(I18n.console.capabilities[printed.error.code]));
 */
export abstract class LabelPrinter extends Port {
  /** Type-only port key, so `DriverName<LabelPrinter>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.LabelPrinter";

  /** Whether a printer answers now. */
  abstract probe(): Promise<CapabilityResult>;

  /** Prints `label.copies` copies of the label. */
  abstract print(label: Label): Promise<CapabilityResult<PrintedLabel>>;
}
