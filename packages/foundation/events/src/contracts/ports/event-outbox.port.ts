/**
 * Stackra file contract:
 * Purpose: the `EventOutbox` port: where the unit of work writes the integration events of a commit, in the same
 *          transaction as the state change, so they leave the service exactly when the change is durable.
 * Boundary: an abstract class that is its own token. `@stackra/outbox` implements it (transactional table, relay,
 *           inbox dedup) and `@stackra/events/testing` ships the in-memory `OutboxFake`; this package never imports
 *           the outbox (ADR 0305 rule 20 keeps the arrow one way).
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decisions 3 and 4: the transactional outbox); ADR 0141 (decision 3); ADR 0305
 *                     (rule 21: a domain event leaves only as an integration event through the outbox).
 */
import { Port } from "@stackra/contracts";

import type { RecordedEvent } from "#contracts/types/recorded-event.type";

/**
 * Stores integration events for delivery after commit.
 *
 * @example
 * export class PostgresEventOutboxDriver extends Driver(EventOutbox) {
 *   async write(records: readonly RecordedEvent[]): Promise<void> {
 *     await this.em.insertMany(OutboxRow, records.map(toRow));
 *   }
 * }
 */
export abstract class EventOutbox extends Port {
  /** Stores `records`, in order, inside the caller's transaction; resolves once they are written. */
  abstract write(records: readonly RecordedEvent[]): Promise<void>;
}
