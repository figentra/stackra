/**
 * Stackra file contract:
 * Purpose: `CrossAppFanOut`, the producer's step from an in-app publish to the cross-app relay: for each envelope the
 *          outbox relay just published (the current version and each older one under the same id), it writes one
 *          delivery per subscriber whose events include that versioned type, with `envelopeVersion` set.
 * Boundary: a platform service over the `SubscriberSource` and `DeliveryDriver` ports. `OutboxRelayService` resolves it
 *           only when the container binds it, so a service with no relay configuration publishes exactly as before. It
 *           writes in the relay's transaction; a failure fails the outbox message, which retries, and the store's unique
 *           (event id, subscriber, type) keeps the rows single. A sibling consumer in the same app is not a subscriber,
 *           so it gets no delivery.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12 and 17, amendment of 2026-11-02); ADR 0141 (2026-10-23 note: older
 *                     versions under the same id); ADR 0078 (decision 4).
 */
import { Service } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";

import type { Delivery, DeliveryDriver, EventEnvelope, SubscriberSource } from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";

/**
 * Writes cross-app deliveries for published events.
 *
 * @example
 * await fanOut.fanOut([envelope, ...olderEnvelopes(envelope, now)], now);
 */
export class CrossAppFanOut extends Service {
  /** Who takes which event type. */
  private readonly source: SubscriberSource;

  /** Where deliveries are stored. */
  private readonly driver: DeliveryDriver;

  /**
   * @param source - the subscribers of each event type.
   * @param driver - the delivery store.
   */
  constructor(source: SubscriberSource, driver: DeliveryDriver) {
    super();
    this.source = source;
    this.driver = driver;
  }

  /** Writes one delivery per subscriber of each envelope's type, due at `now`; a kept one is skipped. */
  async fanOut(envelopes: readonly EventEnvelope[], now: Date): Promise<void> {
    const deliveries: Delivery[] = [];
    for (const envelope of envelopes)
      for (const subscriber of await this.source.subscribersOf(envelope.type))
        deliveries.push({
          id: mintPublicId("dlv", now.getTime()),
          eventId: envelope.id,
          subscriber: subscriber.member,
          type: envelope.type,
          envelope: { ...envelope, envelopeVersion: CROSS_APP_DEFAULTS.envelopeVersion },
          attempts: 0,
          availableAt: now,
          createdAt: now,
        });
    await this.driver.write(deliveries);
  }
}
