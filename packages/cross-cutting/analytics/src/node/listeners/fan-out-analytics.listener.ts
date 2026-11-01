/**
 * Stackra file contract:
 * Purpose: `FanOutAnalyticsListener`, the analytics service's fan-out (ADR 0483 decision 4): each
 *          `analytics.batch.accepted.v1` the ingest action wrote through the outbox is sent to its destination's
 *          driver, the bound `AnalyticsDriver` for `default` and a named instance from `AnalyticsDriverLookup`
 *          otherwise (PostHog free, GA4 in `@stackra-pro/analytics-destinations`).
 * Boundary: subscribed by the type of the event parameter; runs after the ingest call committed, once per event id.
 *           One event is one destination, so a driver's rejection is the outbox relay's retry of that destination
 *           alone. Consent and routing were decided when the event was written; this listener sends what it is given
 *           and never widens it. A destination the lookup does not know rejects, so the event dead-letters instead of
 *           vanishing.
 * Runtime: node
 * Governing contract: ADR 0483 (decisions 4 and 5); ADR 0078 (decision 4: listener semantics); ADR 0461 (Pro drivers).
 */
import { Listener, type ListenerContext } from "@stackra/events";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";
import { ANALYTICS_DEFAULT_DESTINATION } from "#core/constants/analytics-default-destination.constant";
import type { AnalyticsBatchAccepted } from "#node/events/analytics-batch-accepted.event";

/**
 * Sends an accepted batch to its destination.
 *
 * @example
 * await listener.handle(AnalyticsBatchAccepted.create({ destination: "ga4", snapshotId, deliveries }), ctx);
 */
export class FanOutAnalyticsListener extends Listener {
  /** The `default` destination's driver (`config:analytics.driver`). */
  private readonly driver: AnalyticsDriver;

  /** Finds the named driver instances of the other destinations. */
  private readonly lookup: AnalyticsDriverLookup;

  /**
   * @param driver - the bound analytics driver.
   * @param lookup - finds the named driver instances in `AnalyticsConfig.drivers`.
   */
  constructor(driver: AnalyticsDriver, lookup: AnalyticsDriverLookup) {
    super();
    this.driver = driver;
    this.lookup = lookup;
  }

  /**
   * Sends `event`'s deliveries to its destination once.
   *
   * @throws RangeError when no driver instance is named `event.destination`.
   */
  async handle(event: AnalyticsBatchAccepted, _ctx: ListenerContext): Promise<void> {
    const sender =
      event.destination === ANALYTICS_DEFAULT_DESTINATION
        ? this.driver
        : this.lookup.driver(event.destination);
    if (sender === undefined)
      throw new RangeError(
        `analytics.batch.accepted names the destination "${event.destination}", which analytics.drivers does not provide`,
      );
    await sender.send(event.deliveries);
  }
}
