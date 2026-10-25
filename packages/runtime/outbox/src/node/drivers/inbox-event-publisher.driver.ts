/**
 * Stackra file contract:
 * Purpose: `InboxEventPublisherDriver`, the in-process `EventPublisher`: the relay publishes an integration event
 *          straight into this service's own inbox, so its listeners run once each, after the commit, even when the relay
 *          publishes an event twice. It is the transport of a single service, a test, and on-prem until a queue driver.
 * Boundary: a driver of this package's port (driver name `inbox`); other services' inboxes are reached by the
 *           transports gen supplies (Encore Pub/Sub, a Postgres queue), never by this driver.
 * Runtime: node
 * Governing contract: ADR 0142 (decision 1); ADR 0078 (decisions 2 and 4).
 */
import { Driver } from "@stackra/container";

import { EventPublisher } from "#contracts/index";
import type { EventEnvelope } from "#contracts/index";
import type { InboxService } from "#node/services/inbox.service";

/**
 * Publishes into this service's inbox.
 *
 * @example
 * // generated wiring: { port: EventPublisher, candidates: { inbox: () => import("@stackra/outbox/node").then((m) => m.InboxEventPublisherDriver) } }
 */
export class InboxEventPublisherDriver extends Driver(EventPublisher) {
  /** This service's inbox. */
  private readonly inbox: InboxService;

  /** @param inbox - the inbox the events are received by. */
  constructor(inbox: InboxService) {
    super();
    this.inbox = inbox;
  }

  /** See `EventPublisher.publish`. */
  async publish(envelope: EventEnvelope): Promise<void> {
    await this.inbox.receive(envelope);
  }
}
