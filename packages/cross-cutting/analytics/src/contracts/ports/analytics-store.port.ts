/**
 * Stackra file contract:
 * Purpose: the `AnalyticsStore` port: Stackra's own store of analytics deliveries, which the analytics service appends
 *          to, scans by capture time and erases a subject from. It is the store a later own-store `ProductAnalytics`
 *          driver reads, beside PostHog.
 * Boundary: an abstract class that is its own token, server side only. This package ships the `memory` driver in
 *           `./node`. An OLAP engine behind it (ClickHouse for SaaS, DuckDB over Parquet on-prem) is a Pro driver that
 *           waits on ADR 0227, which still defers an OLAP engine ("Postgres with the approved extensions"). Writes are at
 *           least once, so `append` keeps a delivery once per `eventId`. `erasePerson` removes every copy the store
 *           holds of a subject (ADR 0189), never only the identified ones.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (decision 3) and ADR 0163 (decision 5), both amended 2026-10-29 (STA-1430); ADR 0227
 *                     (the OLAP row); ADR 0461 (Pro drivers); ADR 0189 (decision 2); ADR 0142 (drivers behind ports).
 */
import { Port } from "@stackra/contracts";

import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import type { AnalyticsStoreQuery } from "#contracts/types/analytics-store-query.type";

/**
 * Keeps analytics deliveries and reads them back.
 *
 * @example
 * await store.append(event.deliveries);
 * for await (const delivery of store.scan({ from: "2026-11-01T00:00:00Z", to: "2026-11-02T00:00:00Z" })) { ... }
 */
export abstract class AnalyticsStore extends Port {
  /** Keeps `deliveries`; one whose `eventId` is already kept is skipped, so a redelivery adds nothing. */
  abstract append(deliveries: readonly AnalyticsDelivery[]): Promise<void>;

  /**
   * The kept deliveries `query` names, oldest capture first.
   *
   * @throws RangeError when a bound is not an ISO 8601 instant.
   */
  abstract scan(query: AnalyticsStoreQuery): AsyncIterable<AnalyticsDelivery>;

  /**
   * Deletes the deliveries of the subject whose public id is `subject`: those that carry it as `userId`, and those of
   * every anonymous id that ever carried it. Resolves the number deleted, 0 when none is kept.
   */
  abstract erasePerson(subject: string): Promise<number>;
}
