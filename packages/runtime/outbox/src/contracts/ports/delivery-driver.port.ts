/**
 * Stackra file contract:
 * Purpose: the `DeliveryDriver` port: the producer's store of cross-app deliveries, one row per event, subscriber and
 *          wire name. Config `outbox.driver` picks the driver (`postgres`, `memory`), as it picks the other stores.
 * Boundary: an abstract class that is its own token, keyed `outbox.DeliveryDriver`. A driver stores and lists; it never
 *           delivers, computes a backoff or reads a clock: the relay passes `now` and the retry time. `write` ignores a
 *           delivery whose event id, subscriber and wire name are already stored, so a relay that writes again after a
 *           failure writes each once. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4); ADR 0142; ADR 0294 (decisions 4, 15
 *                     and 16).
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { Delivery } from "#contracts/types/delivery.type";
import type { OutboxError } from "#contracts/types/outbox-error.type";

/**
 * A store of cross-app deliveries.
 *
 * @example
 * export class PostgresDeliveryDriver extends Driver(DeliveryDriver) {
 *   async write(deliveries: readonly Delivery[]): Promise<void> { ... }
 * }
 */
export abstract class DeliveryDriver extends Port {
  /** Type-only port key, so `DriverName<DeliveryDriver>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.DeliveryDriver";

  /** Stores `deliveries`, skipping one whose event id, subscriber and wire name are already stored. */
  abstract write(deliveries: readonly Delivery[]): Promise<void>;

  /** Up to `limit` live deliveries due at `now`, oldest first, taking at most `limit` of each subscriber in turn. */
  abstract due(now: Date, limit: number): Promise<readonly Delivery[]>;

  /** Deletes a delivered or abandoned delivery. */
  abstract remove(id: PublicId<"dlv">): Promise<void>;

  /** Counts a failed attempt and makes the delivery due again at `availableAt`. */
  abstract retry(id: PublicId<"dlv">, availableAt: Date, error: OutboxError): Promise<void>;

  /** Counts the last attempt and dead-letters the delivery at `at`. */
  abstract deadLetter(id: PublicId<"dlv">, error: OutboxError, at: Date): Promise<void>;

  /** The deliveries of `subscriber` (all when absent) in `state`, oldest first: what an operator lists. */
  abstract list(filter: {
    readonly subscriber?: string;
    readonly state: "pending" | "failing" | "dead";
  }): Promise<readonly Delivery[]>;

  /** Makes a dead delivery due at `at` with no attempts counted; `false` when `id` names no dead delivery. */
  abstract replay(id: PublicId<"dlv">, at: Date): Promise<boolean>;

  /** Deletes dead deliveries dead-lettered before `before`; how many were deleted. */
  abstract pruneDead(before: Date): Promise<number>;
}
