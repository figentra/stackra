/**
 * Stackra file contract:
 * Purpose: `CrossAppFanOutService`, the producer's fan-out: for an event the outbox relay has published inside its own
 *          app, it writes one delivery per subscriber in another app that takes the event's wire name, each due at
 *          once, carrying the envelope with `envelopeVersion` and without `producer`.
 * Boundary: a service over `SubscriberSource` and `DeliveryDriver`; the outbox relay calls it (resolved from its
 *           container only when bound), so a service with no subscriber writes nothing. The driver skips a delivery
 *           already stored for the same event, subscriber and wire name, so a relay that publishes again writes each
 *           once. It never sends: `CrossAppRelayService` does. Never used between services of one app (d14).
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12, 14 and 17, amendment of 2026-11-02); ADR 0078 (decision 4).
 */
import { Service } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";

import type {
  CrossAppEnvelope,
  Delivery,
  DeliveryDriver,
  EventEnvelope,
  SubscriberSource,
} from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";

/**
 * Writes an event's cross-app deliveries.
 *
 * @example
 * await fanOut.enqueue(envelope, now); // 1 when billing takes payments.payment.captured.v1
 */
export class CrossAppFanOutService extends Service {
  /** Who takes which event. */
  private readonly source: SubscriberSource;

  /** The delivery store. */
  private readonly deliveries: DeliveryDriver;

  /**
   * @param source - the subscribers per wire name.
   * @param deliveries - where the deliveries are written.
   */
  constructor(source: SubscriberSource, deliveries: DeliveryDriver) {
    super();
    this.source = source;
    this.deliveries = deliveries;
  }

  /**
   * Writes a delivery of `envelope` for each subscriber of its wire name, due at `now`.
   *
   * @returns how many subscribers take it.
   */
  async enqueue(envelope: EventEnvelope, now: Date): Promise<number> {
    const subscribers = this.source.subscribersOf(envelope.type);
    if (subscribers.length === 0) return 0;
    const sent: CrossAppEnvelope = Object.freeze({
      id: envelope.id,
      type: envelope.type,
      occurredAt: envelope.occurredAt,
      ...(envelope.scope === undefined ? {} : { scope: envelope.scope }),
      meta: envelope.meta,
      data: envelope.data,
      envelopeVersion: CROSS_APP_DEFAULTS.envelopeVersion,
    });
    const deliveries: Delivery[] = subscribers.map((subscriber) =>
      Object.freeze({
        id: mintPublicId("dlv", now.getTime()),
        subscriber: subscriber.member,
        envelope: sent,
        attempts: 0,
        availableAt: now,
        createdAt: now,
      }),
    );
    await this.deliveries.write(deliveries);
    return deliveries.length;
  }
}
