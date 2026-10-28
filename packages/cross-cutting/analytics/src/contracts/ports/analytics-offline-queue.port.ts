/**
 * Stackra file contract:
 * Purpose: the `AnalyticsOfflineQueue` port: where the delivery engine keeps the batches it could not deliver (retries
 *          spent, or the page closing with no beacon), so the next launch sends them. Config `analytics.offlineDriver`
 *          picks the driver: `none` (the default, nothing kept), `memory` (tests) or `storage` (a device's `prefs`
 *          area through `@stackra/storage`).
 * Boundary: an abstract class that is its own token. Storage only and synchronous. Only `AnalyticsClient` writes it,
 *           only deliveries that already passed consent, and it clears it when consent is refused; it loads it again
 *           only once consent is granted. A driver bounds what it keeps by `offlineLimit` (the oldest go first) and
 *           never throws on a missing or unreadable value.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Keeps undelivered analytics batches for the next launch.
 *
 * @example
 * offline.save([...offline.load(), ...failed]);
 */
export abstract class AnalyticsOfflineQueue extends Port {
  /** Every kept delivery, oldest first; empty when none is kept or what is kept cannot be read. */
  abstract load(): readonly AnalyticsDelivery[];

  /** Replaces what is kept with `deliveries` (bounded by the driver). */
  abstract save(deliveries: readonly AnalyticsDelivery[]): void;

  /** Removes everything kept. */
  abstract clear(): void;
}
