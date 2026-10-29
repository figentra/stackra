/**
 * Stackra file contract:
 * Purpose: the `AnalyticsDriver` port: hands analytics events, in order, to a product-analytics provider. Config
 *          `analytics.driver` picks the driver by name.
 * Boundary: an abstract class that is its own token. It is called only after the consent category is granted, so a
 *           driver never checks consent and never sees an event the visitor refused. This package ships `none` (the
 *           default), `memory` and `posthog` in `.`, and a native `posthog` in `./native`. The delivery engine in
 *           `AnalyticsClient` owns batching and retries (stackra-406): a driver sends once and rejects on failure, and
 *           the client retries the batch with bounded backoff, so a driver never retries itself. `beacon` is the
 *           page-closing path: a driver that can hand a batch to `navigator.sendBeacon` overrides it; the default
 *           answers `false` and the client falls back to `send`. `erasePerson` is the server side of an erasure
 *           (STA-1582): it deletes the subject's person, and the events captured for it, at the vendor; a driver
 *           with nothing at a vendor (`none`) resolves, and the default rejects, so a vendor driver that cannot erase
 *           never reports a silent success.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0294 (decisions 4, 15, 16 and 17); ADR 0305 (rule 8);
 *                     ADR 0266 (one option, one driver, memory first); analytics gap 6 (the delivery engine, stackra-406);
 *                     ADR 0189 (decision 2: erasure reaches every copy, STA-1582).
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
  /**
   * Sends `deliveries` in the order given, once; rejects when they were not accepted, and the client retries.
   */
  abstract send(deliveries: readonly AnalyticsDelivery[]): Promise<void>;

  /**
   * Hands `deliveries` to the browser to send while the page closes (`navigator.sendBeacon`); `true` when the browser
   * took them. The default cannot, so the client sends them with `send` instead.
   */
  beacon(_deliveries: readonly AnalyticsDelivery[]): boolean {
    return false;
  }

  /**
   * Deletes the person whose distinct id is `subject` (the subject's public id), with its events, at the vendor; the
   * number of persons deleted, 0 when the vendor knows none. Server only.
   *
   * @throws Error by default: this driver cannot erase at its vendor, so the erasure listener's event dead-letters.
   */
  erasePerson(_subject: string): Promise<number> {
    return Promise.reject(
      new Error(`${this.constructor.name} cannot erase a person at its analytics vendor`),
    );
  }
}
