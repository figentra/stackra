/**
 * Stackra file contract:
 * Purpose: `RelayTrackedAnalyticsListener`, the server side of `Action({ analytics })` and `Query({ analytics })`: each
 *          `analytics.tracked.v1` the pipeline wrote through the outbox is sent to the bound `AnalyticsDriver` (the
 *          server destinations: PostHog, or the Pro Segment and ClickHouse drivers) as one `AnalyticsDelivery`, with
 *          `AnalyticsConfig.denyProperties` removed.
 * Boundary: subscribed by the type of the event parameter; runs after the call committed, once per event id, and a
 *           driver's rejection is the outbox relay's retry. Consent was decided when the event was written (the call's
 *           verified snapshot granted `analytics`, ADR 0472); this listener sends what it is given and never widens
 *           it. A server call has no visit, so the call id stands as the session id. Sampling stays a client concern.
 * Runtime: node
 * Governing contract: ADR 0216 (decision 1: analytics is its own stream); ADR 0298 (consent gates every send); ADR
 *                     0472 (decision 3); ADR 0078 (decision 4: listener semantics); gap analysis analytics 10
 *                     (stackra-410, STA-1512).
 */
import type { AnalyticsTracked } from "@stackra/actions";
import { Listener, type ListenerContext } from "@stackra/events";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/** The library a server delivery's context names. */
const LIBRARY = "@stackra/actions";

/**
 * Relays server-side analytics to the destinations.
 *
 * @example
 * await listener.handle(AnalyticsTracked.create({ eventId, name: "lead.submitted", properties, ... }), ctx);
 */
export class RelayTrackedAnalyticsListener extends Listener {
  /** The destinations. */
  private readonly driver: AnalyticsDriver;

  /** `denyProperties` names the properties that never leave. */
  private readonly config: AnalyticsConfig;

  /**
   * @param driver - the bound analytics driver (`config:analytics.driver`).
   * @param config - the analytics configuration.
   */
  constructor(driver: AnalyticsDriver, config: AnalyticsConfig) {
    super();
    this.driver = driver;
    this.config = config;
  }

  /** Sends `event` as one track delivery. */
  async handle(event: AnalyticsTracked, _ctx: ListenerContext): Promise<void> {
    const denied = new Set(this.config.denyProperties);
    const delivery: AnalyticsDelivery = {
      eventId: event.eventId,
      kind: AnalyticsDeliveryKind.Track,
      name: event.name,
      properties: Object.fromEntries(
        Object.entries(event.properties).filter(([name]) => !denied.has(name)),
      ),
      occurredAt: event.occurredAt,
      anonymousId: event.anonymousId,
      ...(event.userId === undefined ? {} : { userId: event.userId }),
      sessionId: event.callId,
      context: { library: { name: LIBRARY }, locale: event.locale },
    };
    await this.driver.send([delivery]);
  }
}
