/**
 * Stackra file contract:
 * Purpose: `MemoryDeliveryDriver`, the `DeliveryDriver` of a test or a single process: cross-app deliveries in process
 *          memory, the envelope stored as JSON as Postgres stores it, listed and taken in the order and fairness
 *          Postgres gives them.
 * Boundary: no transaction: a write is kept at once. A write whose event id, subscriber and wire name are already
 *           stored is skipped, as `on conflict do nothing` skips it. It never delivers, computes a backoff or reads a
 *           clock: the relay passes `now` and the retry time.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4); ADR 0142 (drivers behind ports); ADR 0266
 *                     (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { DeliveryDriver } from "#contracts/index";
import type { Delivery, OutboxError } from "#contracts/index";

/** Oldest first, by id within one instant. */
function byAge(left: Delivery, right: Delivery): number {
  return (
    left.createdAt.getTime() - right.createdAt.getTime() ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

/** The key one delivery is stored once under: event id, subscriber and wire name. */
function keyOf(delivery: Delivery): string {
  return JSON.stringify([delivery.envelope.id, delivery.subscriber, delivery.envelope.type]);
}

/**
 * Keeps cross-app deliveries in memory.
 *
 * @example
 * const driver = new MemoryDeliveryDriver();
 * await driver.write([delivery]);
 */
export class MemoryDeliveryDriver extends Driver(DeliveryDriver) {
  /** Delivery id to delivery. */
  private readonly deliveries = new Map<string, Delivery>();

  /** Implements `DeliveryDriver.write`, documented there. */
  write(deliveries: readonly Delivery[]): Promise<void> {
    const keys = new Set([...this.deliveries.values()].map(keyOf));
    for (const delivery of deliveries) {
      const key = keyOf(delivery);
      if (keys.has(key)) continue;
      keys.add(key);
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (undefined and functions drop)
      const envelope = JSON.parse(JSON.stringify(delivery.envelope)) as Delivery["envelope"];
      this.deliveries.set(delivery.id, Object.freeze({ ...delivery, envelope }));
    }
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.due`, documented there. */
  due(now: Date, limit: number): Promise<readonly Delivery[]> {
    const at = now.getTime();
    const turns = new Map<string, number>();
    const ranked = [...this.deliveries.values()]
      .filter((delivery) => delivery.deadAt === undefined && delivery.availableAt.getTime() <= at)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(byAge)
      .map((delivery) => {
        const turn = turns.get(delivery.subscriber) ?? 0;
        turns.set(delivery.subscriber, turn + 1);
        return { delivery, turn };
      });
    // The sort is stable and `ranked` is already oldest first, so ties on turn keep that order.
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
    ranked.sort((left, right) => left.turn - right.turn || byAge(left.delivery, right.delivery));
    return Promise.resolve(ranked.slice(0, limit).map((entry) => entry.delivery));
  }

  /** Implements `DeliveryDriver.remove`, documented there. */
  remove(id: PublicId<"dlv">): Promise<void> {
    this.deliveries.delete(id);
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.retry`, documented there. */
  retry(id: PublicId<"dlv">, availableAt: Date, error: OutboxError): Promise<void> {
    this.failed(id, { availableAt, lastError: error });
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.deadLetter`, documented there. */
  deadLetter(id: PublicId<"dlv">, error: OutboxError, at: Date): Promise<void> {
    this.failed(id, { deadAt: at, lastError: error });
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.list`, documented there. */
  list(filter: {
    readonly subscriber?: string;
    readonly state: "pending" | "failing" | "dead";
  }): Promise<readonly Delivery[]> {
    const listed = [...this.deliveries.values()].filter(
      (delivery) =>
        (filter.subscriber === undefined || delivery.subscriber === filter.subscriber) &&
        (filter.state === "dead"
          ? delivery.deadAt !== undefined
          : delivery.deadAt === undefined &&
            (filter.state === "pending" ? delivery.attempts === 0 : delivery.attempts > 0)),
    );
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
    return Promise.resolve(listed.sort(byAge));
  }

  /** Implements `DeliveryDriver.replay`, documented there. */
  replay(id: PublicId<"dlv">, at: Date): Promise<boolean> {
    const delivery = this.deliveries.get(id);
    if (delivery?.deadAt === undefined) return Promise.resolve(false);
    const { deadAt: _deadAt, lastError: _lastError, ...rest } = delivery;
    this.deliveries.set(id, Object.freeze({ ...rest, attempts: 0, availableAt: at }));
    return Promise.resolve(true);
  }

  /** Implements `DeliveryDriver.pruneDead`, documented there. */
  pruneDead(before: Date): Promise<number> {
    let pruned = 0;
    for (const [id, delivery] of this.deliveries)
      if (delivery.deadAt !== undefined && delivery.deadAt.getTime() < before.getTime()) {
        this.deliveries.delete(id);
        pruned += 1;
      }
    return Promise.resolve(pruned);
  }

  /** Every delivery kept, dead ones included, oldest first; for a test's assertions. */
  stored(): readonly Delivery[] {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
    return [...this.deliveries.values()].sort(byAge);
  }

  /** Counts a failed attempt of delivery `id` and replaces `fields`; a delivery no longer kept is left alone. */
  private failed(id: string, fields: Partial<Delivery>): void {
    const delivery = this.deliveries.get(id);
    if (delivery !== undefined)
      this.deliveries.set(
        id,
        Object.freeze({ ...delivery, ...fields, attempts: delivery.attempts + 1 }),
      );
  }
}
