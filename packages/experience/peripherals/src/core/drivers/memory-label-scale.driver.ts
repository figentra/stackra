/**
 * Stackra file contract:
 * Purpose: `MemoryLabelScaleDriver`, the `LabelScale` driver that keeps each named scale's items in memory: the only
 *          candidate this package ships for the port, so a store's price sync and its missed-sync alerts are testable
 *          before a vendor driver exists.
 * Boundary: no device is touched. Every scale name answers; a name in `offline` refuses every call with capability
 *           `network` and keeps its items as they were. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers);
 *                     STA-965.
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { LabelScale } from "#contracts/ports/label-scale.port";
import type { LabelScaleItem } from "#contracts/types/label-scale-item.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * Label scales in memory.
 *
 * @example
 * const scales = new MemoryLabelScaleDriver();
 * await scales.sync("deli_1", [halloumi]); // { ok: true, data: ["12345"] }
 * scales.items("deli_1"); // [halloumi]
 * scales.offline.add("deli_1"); // the next sync refuses
 */
export class MemoryLabelScaleDriver extends Driver(LabelScale) {
  /** The scale names that do not answer. */
  readonly offline = new Set<string>();

  /** Each scale's items by item code. */
  private readonly scales = new Map<string, Map<string, LabelScaleItem>>();

  /** The items `scale` holds now, in the order they were first sent. */
  items(scale: string): LabelScaleItem[] {
    return [...(this.scales.get(scale)?.values() ?? [])];
  }

  /** Answers unless `scale` is offline. */
  async probe(scale: string): Promise<CapabilityResult> {
    if (this.offline.has(scale)) return refuse(PlatformCapability.Network, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Adds or replaces `items` on `scale`. */
  async sync(
    scale: string,
    items: readonly LabelScaleItem[],
  ): Promise<CapabilityResult<readonly string[]>> {
    if (this.offline.has(scale)) return refuse(PlatformCapability.Network, "unavailable");
    const held = this.scales.get(scale) ?? new Map<string, LabelScaleItem>();
    for (const item of items) held.set(item.itemCode, item);
    this.scales.set(scale, held);
    return { ok: true, data: items.map((item) => item.itemCode) };
  }

  /** Removes the items with `itemCodes` from `scale`. */
  async remove(scale: string, itemCodes: readonly string[]): Promise<CapabilityResult> {
    if (this.offline.has(scale)) return refuse(PlatformCapability.Network, "unavailable");
    for (const itemCode of itemCodes) this.scales.get(scale)?.delete(itemCode);
    return { ok: true, data: undefined };
  }
}
