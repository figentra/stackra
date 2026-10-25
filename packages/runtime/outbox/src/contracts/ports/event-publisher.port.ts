/**
 * Stackra file contract:
 * Purpose: the `EventPublisher` port: the transport the relay publishes integration events through. In process it is
 *          this service's own inbox (`InboxEventPublisherDriver`); across services it is the generated Encore Pub/Sub
 *          topic in SaaS or a Postgres queue on-prem, whose drivers gen supplies (ADR 0142 decision 1).
 * Boundary: an abstract class that is its own token, keyed `outbox.EventPublisher`. `publish` resolves once the
 *           transport has the event; a rejection makes the relay retry it later, so a transport may see an event more
 *           than once and every consumer deduplicates by id. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0142 (decisions 1 and 2: transports are drivers); ADR 0078 (decisions 4 and 8: packages never
 *                     import `encore.dev`); ADR 0141 (decision 2).
 */
import { Port } from "@stackra/contracts";

import type { EventEnvelope } from "#contracts/types/event-envelope.type";

/**
 * Publishes integration events.
 *
 * @example
 * export class TopicEventPublisherDriver extends Driver(EventPublisher) {
 *   async publish(envelope: EventEnvelope): Promise<void> {
 *     await this.topics.get(envelope.type)?.publish(envelope);
 *   }
 * }
 */
export abstract class EventPublisher extends Port {
  /** Type-only port key, so `DriverName<EventPublisher>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.EventPublisher";

  /** Hands `envelope` to the transport; resolves once the transport has it. */
  abstract publish(envelope: EventEnvelope): Promise<void>;
}
