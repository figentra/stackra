/**
 * Stackra file contract:
 * Purpose: the `OfflineCapStore` port: where the pipeline counts each device's applied calls of a capped action, so a
 *          replayed queue is reconciled against the action's `offline.cap` within its window.
 * Boundary: an abstract class that is its own token. Only applied calls are recorded; a refused call never is. A
 *           device's calls run in sequence order, so a read and the record after it never race for one device. This
 *           package ships the memory driver; a durable driver comes through `@stackra/database`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5: caps per action, reconciled on sync); ADR 0263 (ports are classes).
 */
import { Port } from "@stackra/contracts";

import type { OfflineCapUsage } from "#contracts/types/offline-cap-usage.type";

/**
 * Counts a device's applied calls of a capped action.
 *
 * @example
 * const used = await store.usage(deviceId, "gift_cards.gift_card.redeem@1", since);
 * await store.record(deviceId, "gift_cards.gift_card.redeem@1", now, 2_500);
 */
export abstract class OfflineCapStore extends Port {
  /** The calls of `key` the device applied at or after `since`, and their summed amount. */
  abstract usage(deviceId: string, key: string, since: Date): Promise<OfflineCapUsage>;

  /** Records one applied call of `key` by the device at `at`, carrying `amount` (0 when the cap counts calls only). */
  abstract record(deviceId: string, key: string, at: Date, amount: number): Promise<void>;
}
