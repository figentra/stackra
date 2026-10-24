/**
 * Stackra file contract:
 * Purpose: the `AnalyticsDriver` port: hands analytics events, in order, to a product-analytics provider. Config
 *          `analytics.driver` picks the driver by name.
 * Boundary: an abstract class that is its own token. It is called only after the consent category is granted, so a
 *           driver never checks consent and never sees an event the visitor refused. This package ships `none` (the
 *           default) and a `memory` driver in `./testing`; vendor drivers come later. A driver owns its retries: a
 *           rejected `send` is not retried by the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0294 (decisions 4, 15, 16 and 17); ADR 0305 (rule 8);
 *                     ADR 0266 (one option, one driver, memory first).
 */
import { Port } from "@stackra/contracts";

import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Sends analytics events.
 *
 * @example
 * export class MemoryAnalyticsDriver extends Driver(AnalyticsDriver) {
 *   send(deliveries: readonly AnalyticsDelivery[]): Promise<void> { ... }
 * }
 */
export abstract class AnalyticsDriver extends Port {
  /** Sends `deliveries` in the order given: the queue that waited for consent first, then the event just tracked. */
  abstract send(deliveries: readonly AnalyticsDelivery[]): Promise<void>;
}
