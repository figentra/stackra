/**
 * Stackra file contract:
 * Purpose: `MemoryDeliveryDriver`, the `DeliveryDriver` of a test or a single process: cross-app deliveries in process
 *          memory, the envelope stored as JSON as Postgres stores it, unique on (event id, subscriber, type), listed in
 *          the order and with the per-subscriber limit Postgres lists them.
 * Boundary: no transaction: a write is kept at once (the Postgres driver is the transactional one).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); ADR 0142; ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { DeliveryDriver } from "#contracts/index";
import type { Delivery, DeliveryError, DeliveryState } from "#contracts/index";
import { deliveryStateOf } from "#core/functions/delivery-state-of.function";

/** Oldest written first, by id within one instant. */
function byAge(left: Delivery, right: Delivery): number {
  return (
    left.createdAt.getTime() - right.createdAt.getTime() ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

/** By subscriber, then oldest written first: the relay's order. */
function byOrder(left: Delivery, right: Delivery): number {
  return (
    (left.subscriber < right.subscriber ? -1 : left.subscriber > right.subscriber ? 1 : 0) ||
    byAge(left, right)
  );
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
    for (const delivery of deliveries) {
      const kept = [...this.deliveries.values()].some(
        (each) =>
          each.eventId === delivery.eventId &&
          each.subscriber === delivery.subscriber &&
          each.type === delivery.type,
      );
      if (kept) continue;
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does
      const envelope = JSON.parse(JSON.stringify(delivery.envelope)) as Delivery["envelope"];
      this.deliveries.set(delivery.id, Object.freeze({ ...delivery, envelope }));
    }
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.due`, documented there. */
  due(now: Date, limit: number): Promise<readonly Delivery[]> {
    const taken = new Map<string, number>();
    const due = [...this.deliveries.values()]
      .filter((each) => each.deadAt === undefined && each.availableAt.getTime() <= now.getTime())
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(byOrder)
      .filter((each) => {
        const count = (taken.get(each.subscriber) ?? 0) + 1;
        taken.set(each.subscriber, count);
        return count <= limit;
      });
    return Promise.resolve(due);
  }

  /** Implements `DeliveryDriver.remove`, documented there. */
  remove(id: PublicId<"dlv">): Promise<void> {
    this.deliveries.delete(id);
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.retry`, documented there. */
  retry(id: PublicId<"dlv">, availableAt: Date, error: DeliveryError): Promise<void> {
    this.failed(id, { availableAt, lastError: error });
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.deadLetter`, documented there. */
  deadLetter(id: PublicId<"dlv">, error: DeliveryError, at: Date): Promise<void> {
    this.failed(id, { deadAt: at, lastError: error });
    return Promise.resolve();
  }

  /** Implements `DeliveryDriver.list`, documented there. */
  list(filter: {
    readonly subscriber?: string;
    readonly state?: DeliveryState;
    readonly limit: number;
  }): Promise<readonly Delivery[]> {
    const listed = [...this.deliveries.values()]
      .filter(
        (each) =>
          (filter.subscriber === undefined || each.subscriber === filter.subscriber) &&
          (filter.state === undefined || deliveryStateOf(each) === filter.state),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(byAge);
    return Promise.resolve(listed.slice(0, filter.limit));
  }

  /** Implements `DeliveryDriver.replay`, documented there. */
  replay(id: PublicId<"dlv">, now: Date): Promise<boolean> {
    const delivery = this.deliveries.get(id);
    if (delivery?.deadAt === undefined) return Promise.resolve(false);
    const { deadAt: _dead, ...live } = delivery;
    this.deliveries.set(id, Object.freeze({ ...live, attempts: 0, availableAt: now }));
    return Promise.resolve(true);
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
