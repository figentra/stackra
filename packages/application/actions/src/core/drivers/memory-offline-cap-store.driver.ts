/**
 * Stackra file contract:
 * Purpose: `MemoryOfflineCapStoreDriver`, the in-process `OfflineCapStore`: each device's applied calls of a capped
 *          action with their instant and amount, for tests, local runs and single-instance memory deployments.
 * Boundary: one process only; a restart forgets the usage, so a cap restarts from zero. A read drops the entries older
 *           than its `since`: one action's window never changes, so they can never count again.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5).
 */
import { Driver } from "@stackra/container";

import { OfflineCapStore } from "#contracts/ports/offline-cap-store.port";
import type { OfflineCapUsage } from "#contracts/types/offline-cap-usage.type";

/** One applied call: when (epoch milliseconds) and its amount. */
type Use = { readonly at: number; readonly amount: number };

/**
 * Counts capped calls in memory.
 *
 * @example
 * const store = new MemoryOfflineCapStoreDriver();
 * await store.record("dev_1", "gift_cards.gift_card.redeem@1", new Date(), 2_500);
 * await store.usage("dev_1", "gift_cards.gift_card.redeem@1", since); // { count: 1, amount: 2500 }
 */
export class MemoryOfflineCapStoreDriver extends Driver(OfflineCapStore) {
  /** Device id and action key to the applied calls, oldest first. */
  private readonly uses = new Map<string, Use[]>();

  /** The calls at or after `since`, after dropping the older ones. */
  async usage(deviceId: string, key: string, since: Date): Promise<OfflineCapUsage> {
    const slot = `${deviceId}\u0000${key}`;
    const live = (this.uses.get(slot) ?? []).filter((use) => use.at >= since.getTime());
    this.uses.set(slot, live);
    return { count: live.length, amount: live.reduce((sum, use) => sum + use.amount, 0) };
  }

  /** Adds one applied call. */
  async record(deviceId: string, key: string, at: Date, amount: number): Promise<void> {
    const slot = `${deviceId}\u0000${key}`;
    this.uses.set(slot, [...(this.uses.get(slot) ?? []), { at: at.getTime(), amount }]);
  }
}
