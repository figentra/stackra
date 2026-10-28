/**
 * Stackra file contract:
 * Purpose: `MemoryUsedReceiptStoreDriver`, the `UsedReceiptStore` driver of one gate: the receipts that opened it, in
 *          memory, the oldest forgotten first beyond 10,000. The default candidate, and enough for a venue with one exit.
 * Boundary: not shared: two exits each with this driver let one receipt out of each. `until` is ignored (the bound
 *           keeps it small). `isPresent = false` makes every call refuse with capability `network`, as a shared store
 *           that cannot be reached does. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 3); ADR 0449 (decision 4); ADR 0266 (memory drivers first); ADR 0269.
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { UsedReceiptStore } from "#contracts/ports/used-receipt-store.port";
import { refuse } from "#core/functions/refuse.function";

/** How many used receipts one gate remembers. */
const REMEMBERED = 10_000;

/**
 * One gate's used receipts.
 *
 * @example
 * const store = new MemoryUsedReceiptStoreDriver();
 * await store.claim("rct_1", until); // { ok: true, data: true }
 * await store.claim("rct_1", until); // { ok: true, data: false }
 */
export class MemoryUsedReceiptStoreDriver extends Driver(UsedReceiptStore) {
  /** Whether the store answers; false makes every call refuse with `unavailable`. */
  isPresent = true;

  /** The used receipt ids, oldest first. */
  private readonly used = new Set<string>();

  /** Marks the receipt used; true the first time. */
  async claim(receiptId: string, _until: Date): Promise<CapabilityResult<boolean>> {
    if (!this.isPresent) return refuse(PlatformCapability.Network, "unavailable");
    if (this.used.has(receiptId)) return { ok: true, data: false };
    this.used.add(receiptId);
    if (this.used.size > REMEMBERED) this.used.delete(this.used.values().next().value as string);
    return { ok: true, data: true };
  }

  /** Forgets the receipt. */
  async release(receiptId: string): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(PlatformCapability.Network, "unavailable");
    this.used.delete(receiptId);
    return { ok: true, data: undefined };
  }
}
