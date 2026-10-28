/**
 * Stackra file contract:
 * Purpose: `AnalyticsLane`, the delivery state `AnalyticsClient` keeps per destination: its driver, consent category
 *          and event routing, the pre-consent queue and its ledger watch, and the delivery engine's buffer, timer and
 *          failure count, so one destination's consent, failures and retries never hold back another.
 * Boundary: internal and mutable; only `AnalyticsClient` reads or writes it. `primary` marks the `default`
 *           destination, the only one whose spent batches go to the offline queue.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); analytics gaps 6 and 7 (stackra-406, stackra-407).
 */
import type { ConsentCategory } from "@stackra/consent";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/** One destination's delivery state. */
export interface AnalyticsLane {
  /** The driver instance that sends. */
  readonly driver: AnalyticsDriver;
  /** The category that gates this destination. */
  readonly category: ConsentCategory;
  /** Event names taken; empty takes all. */
  readonly include: ReadonlySet<string>;
  /** Event names never taken. */
  readonly exclude: ReadonlySet<string>;
  /** Whether this is the `default` destination, which owns the offline queue. */
  readonly primary: boolean;
  /** Deliveries captured before this destination's category was decided, without visitor ids. */
  readonly queue: Omit<AnalyticsDelivery, "anonymousId" | "sessionId">[];
  /** Deliveries that passed consent and wait for a send. */
  readonly buffer: AnalyticsDelivery[];
  /** Ends the ledger watch of the pending queue. */
  stopWatching: (() => void) | null;
  /** The pending flush or retry. */
  timer: ReturnType<typeof setTimeout> | null;
  /** Failed sends of the batch at the front. */
  failures: number;
}
