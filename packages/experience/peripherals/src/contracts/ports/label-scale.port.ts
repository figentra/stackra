/**
 * Stackra file contract:
 * Purpose: the `LabelScale` port: the price-computing label scales of a store (the deli and produce counters, the
 *          pre-pack room). It sends items and prices to a named scale ahead of their effective time, removes items
 *          the scale no longer sells, and answers a probe, each as a `CapabilityResult` that refuses with capability
 *          `network` when the scale does not answer.
 * Boundary: an abstract class that is its own token, keyed `peripherals.LabelScale`. A store has many scales, so every
 *           call names one (the product's scale record key). The sync log, missed-sync alerts, approvals and what
 *           the scale prints come back as are the product's; the label's embedded barcode is read with
 *           `parseEmbeddedBarcode`. Only the `memory` driver ships; each vendor protocol needs its own ADR.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { LabelScaleItem } from "#contracts/types/label-scale-item.type";

/**
 * The store's label scales.
 *
 * @example
 * const sent = await labelScales.sync("deli_1", [
 *   { itemCode: "12345", name: "Halloumi", price: "42.00", currency: "SAR", byWeight: true, tareGrams: 5,
 *     effectiveAt: null },
 * ]);
 * if (!sent.ok) alerts.missedSync("deli_1");
 */
export abstract class LabelScale extends Port {
  /** Type-only port key. */
  declare readonly "~key": "peripherals.LabelScale";

  /** Whether `scale` answers now. */
  abstract probe(scale: string): Promise<CapabilityResult>;

  /** Adds or replaces `items` on `scale`; answers the item codes the scale took. */
  abstract sync(
    scale: string,
    items: readonly LabelScaleItem[],
  ): Promise<CapabilityResult<readonly string[]>>;

  /** Removes the items with `itemCodes` from `scale`; a code the scale does not hold is skipped. */
  abstract remove(scale: string, itemCodes: readonly string[]): Promise<CapabilityResult>;
}
