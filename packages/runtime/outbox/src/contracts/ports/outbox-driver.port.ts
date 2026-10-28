/**
 * Stackra file contract:
 * Purpose: the `OutboxDriver` port: the message store behind the relay and the `EventOutbox` driver. It keeps messages
 *          written in a producer's transaction, hands the relay the due ones in order, and records how each delivery
 *          ended. Config `outbox.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `outbox.OutboxDriver`. A driver stores and lists; it never
 *           delivers, computes a backoff or reads a clock: the relay passes `now` and the retry time, so every driver
 *           behaves the same. `write` joins the caller's transaction. One relay runs at a time (it holds a lock), so
 *           `due` reserves nothing. A leaf file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4: the outbox table, relay and inbox); data-layer gap gov6 (the prune); ADR 0142 (drivers behind ports);
 *                     ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { OutboxError } from "#contracts/types/outbox-error.type";
import type { OutboxMessage } from "#contracts/types/outbox-message.type";

/**
 * An outbox message store.
 *
 * @example
 * export class ValkeyOutboxDriver extends Driver(OutboxDriver) {
 *   async write(messages: readonly OutboxMessage[]): Promise<void> { ... }
 * }
 */
export abstract class OutboxDriver extends Port {
  /** Type-only port key, so `DriverName<OutboxDriver>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.OutboxDriver";

  /** Stores `messages`, in order, inside the caller's transaction; resolves once they are written. */
  abstract write(messages: readonly OutboxMessage[]): Promise<void>;

  /** Up to `limit` messages due at `now` that are not dead, oldest `occurredAt` first and by id within one instant. */
  abstract due(now: Date, limit: number): Promise<readonly OutboxMessage[]>;

  /** Deletes message `id`: it was delivered. */
  abstract remove(id: PublicId<"evt">): Promise<void>;

  /** Counts a failed delivery of message `id` and makes it due again at `availableAt`, keeping `error`. */
  abstract retry(id: PublicId<"evt">, availableAt: Date, error: OutboxError): Promise<void>;

  /** Counts the last failed delivery of message `id` and dead-letters it at `at`, keeping `error`. */
  abstract deadLetter(id: PublicId<"evt">, error: OutboxError, at: Date): Promise<void>;

  /** Deletes the messages dead-lettered before `before` and says how many; live messages are never pruned. */
  abstract pruneDead(before: Date): Promise<number>;
}
