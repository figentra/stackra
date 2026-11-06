/**
 * Stackra file contract:
 * Purpose: the `DeliveryDriver` port: the producer's store of cross-app deliveries, one per event version and
 *          subscriber. The fan-out writes them, the cross-app relay takes the due ones fairly per subscriber and
 *          records how each ended, and an operator lists and replays them. Config `outbox.driver` picks the driver
 *          (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `outbox.DeliveryDriver`. A driver stores and lists; it never
 *           sends, computes a backoff or reads a clock. `write` ignores a delivery whose (event id, subscriber, type) is
 *           kept already, so a relay retry writes nothing twice. A relay takes due deliveries under a lock with `lease`,
 *           which moves their due time past the sending, and records each outcome later on its own. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); ADR 0078 (decision 4); ADR 0142.
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { DeliveryState } from "#contracts/enums/delivery-state.enum";
import type { Delivery } from "#contracts/types/delivery.type";
import type { DeliveryError } from "#contracts/types/delivery-error.type";

/**
 * A cross-app delivery store.
 *
 * @example
 * export class ValkeyDeliveryDriver extends Driver(DeliveryDriver) { ... }
 */
export abstract class DeliveryDriver extends Port {
  /** Type-only port key, so `DriverName<DeliveryDriver>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.DeliveryDriver";

  /** Stores `deliveries`, skipping any whose (event id, subscriber, type) is kept already. */
  abstract write(deliveries: readonly Delivery[]): Promise<void>;

  /**
   * Takes up to `limit` live deliveries due at `now` of each subscriber, so one backlog never starves another, and
   * makes them due again at `until` (the lease) in the same step, so no other tick takes them while they are sent;
   * grouped by subscriber, oldest written first and by id within one instant.
   */
  abstract lease(now: Date, limit: number, until: Date): Promise<readonly Delivery[]>;

  /** Deletes delivery `id`: the consumer took it. */
  abstract remove(id: PublicId<"dlv">): Promise<void>;

  /** Counts a failed attempt of delivery `id` and makes it due again at `availableAt`, keeping `error`. */
  abstract retry(id: PublicId<"dlv">, availableAt: Date, error: DeliveryError): Promise<void>;

  /** Counts the last failed attempt of delivery `id` and dead-letters it at `at`, keeping `error`. */
  abstract deadLetter(id: PublicId<"dlv">, error: DeliveryError, at: Date): Promise<void>;

  /** Up to `limit` deliveries, of one subscriber and in one state when given, oldest written first. */
  abstract list(filter: {
    readonly subscriber?: string;
    readonly state?: DeliveryState;
    readonly limit: number;
  }): Promise<readonly Delivery[]>;

  /** Makes dead delivery `id` pending again, due at `now`; `false`, changing nothing, when it is not dead. */
  abstract replay(id: PublicId<"dlv">, now: Date): Promise<boolean>;
}
