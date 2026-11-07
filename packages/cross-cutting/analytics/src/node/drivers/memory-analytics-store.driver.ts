/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `AnalyticsStore` port: deliveries kept in this process, once per `eventId`; for
 *          tests and previews.
 * Boundary: in-process state only, unbounded, so never a production store; two instances never share what they keep.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0190 (decision 3, amended 2026-10-29); ADR 0189
 *                     (decision 2).
 */
import { Driver } from "@stackra/container";

import { AnalyticsStore } from "#contracts/ports/analytics-store.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import type { AnalyticsStoreQuery } from "#contracts/types/analytics-store-query.type";

/** `iso` as epoch milliseconds. */
function instant(iso: string, bound: string): number {
  const milliseconds = Date.parse(iso);
  if (Number.isNaN(milliseconds))
    throw new RangeError(`analytics store scan: ${bound} "${iso}" is not an ISO 8601 instant`);
  return milliseconds;
}

/**
 * Keeps analytics deliveries in memory.
 *
 * @example
 * const store = new MemoryAnalyticsStoreDriver();
 * await store.append(deliveries);
 */
export class MemoryAnalyticsStoreDriver extends Driver(AnalyticsStore) {
  /** Kept deliveries by event id, in append order. */
  private readonly kept = new Map<string, AnalyticsDelivery>();

  /** Implements `AnalyticsStore.append`, documented there. */
  append(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    for (const delivery of deliveries)
      if (!this.kept.has(delivery.eventId)) this.kept.set(delivery.eventId, delivery);
    return Promise.resolve();
  }

  /** Implements `AnalyticsStore.scan`, documented there. */
  scan(query: AnalyticsStoreQuery): AsyncIterable<AnalyticsDelivery> {
    const from = instant(query.from, "from");
    const to = instant(query.to, "to");
    const names = query.names === undefined ? undefined : new Set(query.names);
    const found = [...this.kept.values()]
      .map((delivery) => ({ delivery, at: Date.parse(delivery.occurredAt) }))
      .filter(
        ({ delivery, at }) =>
          at >= from && at < to && (names === undefined || names.has(delivery.name)),
      )
      .toSorted((left, right) => left.at - right.at)
      .map(({ delivery }) => delivery);
    return (async function* () {
      yield* found;
    })();
  }

  /** Implements `AnalyticsStore.erasePerson`, documented there. */
  erasePerson(subject: string): Promise<number> {
    const kept = [...this.kept.values()];
    const anonymous = new Set(
      kept
        .filter((delivery) => delivery.userId === subject)
        .map((delivery) => delivery.anonymousId),
    );
    let deleted = 0;
    for (const delivery of kept)
      if (delivery.userId === subject || anonymous.has(delivery.anonymousId)) {
        this.kept.delete(delivery.eventId);
        deleted += 1;
      }
    return Promise.resolve(deleted);
  }
}
