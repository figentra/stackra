/**
 * Stackra file contract:
 * Purpose: the `OutboxDriver` port: the message store behind the relay and the `EventOutbox` driver. It keeps messages
 *          written in a producer's transaction, claims the due ones in order for the relay, loads each in its tenant's
 *          isolation, and records how each delivery ended. Config `outbox.driver` picks the driver (`postgres`,
 *          `memory`).
 * Boundary: an abstract class that is its own token, keyed `outbox.OutboxDriver`. A driver stores and lists; it never
 *           delivers, computes a backoff or reads a clock: the relay passes `now` and the retry time, so every driver
 *           behaves the same. `write` joins the caller's transaction. A claim (`claim`, `claimDead`) reads across
 *           tenants and hands back ids and the owning tenant only; every other method runs in the caller's isolation,
 *           so a tenant row is loaded, changed or deleted only in its own tenant's (ADR 0239 amendment, gaps A and C).
 *           One relay runs at a time (it holds a lock), so `claim` reserves nothing. A platform message (no tenant) is
 *           one no tenant's erasure can rewrite, so a platform writer never puts personal data in one. A leaf file: it
 *           imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4: the outbox table, relay and inbox); ADR 0239 (2026-11-07 amendment, gaps A
 *                     and C); data-layer gap gov6 (the prune, and
 *                     the erasure redaction of held payloads, stackra-275); ADR 0189 (decision 2); ADR 0142 (drivers
 *                     behind ports);
 *                     ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { OutboxClaim } from "#contracts/types/outbox-claim.type";
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

  /**
   * Claims up to `limit` messages of every tenant due at `now` that are not dead, oldest `occurredAt` first and by id
   * within one instant: ids, tenants and due times only.
   */
  abstract claim(now: Date, limit: number): Promise<readonly OutboxClaim[]>;

  /** Message `id` as the caller's isolation reads it; undefined when it is gone or another tenant's. */
  abstract load(id: PublicId<"evt">): Promise<OutboxMessage | undefined>;

  /** Deletes message `id`: it was delivered. */
  abstract remove(id: PublicId<"evt">): Promise<void>;

  /** Counts a failed delivery of message `id` and makes it due again at `availableAt`, keeping `error`. */
  abstract retry(id: PublicId<"evt">, availableAt: Date, error: OutboxError): Promise<void>;

  /** Counts the last failed delivery of message `id` and dead-letters it at `at`, keeping `error`. */
  abstract deadLetter(id: PublicId<"evt">, error: OutboxError, at: Date): Promise<void>;

  /**
   * Claims up to `limit` messages of every tenant dead-lettered before `before`, oldest first; live messages are never
   * claimed. The prune deletes each with `remove` in its tenant's isolation.
   */
  abstract claimDead(before: Date, limit: number): Promise<readonly OutboxClaim[]>;

  /**
   * Every stored message the caller's isolation reads (its tenant's and the platform's), due, waiting or dead, whose
   * payload holds the string `value` at any depth (an erased
   * subject's public id), oldest first and by id within one instant.
   */
  abstract holding(value: string): Promise<readonly OutboxMessage[]>;

  /**
   * Replaces the payload of message `id` with `data` (JSON), keeping its delivery state; an unknown id, or one the
   * caller's isolation may not change (a platform message, for a tenant), is ignored.
   */
  abstract rewrite(id: PublicId<"evt">, data: unknown): Promise<void>;
}
