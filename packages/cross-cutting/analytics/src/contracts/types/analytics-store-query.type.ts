/**
 * Stackra file contract:
 * Purpose: `AnalyticsStoreQuery`, which kept deliveries `AnalyticsStore.scan` reads: a capture-time window, from
 *          inclusive to exclusive, and optionally only the events of some names.
 * Boundary: a type only. The bounds are ISO 8601 instants compared as instants, never as text.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (decision 3, amended 2026-10-29); ADR 0294 (decision 15).
 */

/** What a store scan reads. */
export interface AnalyticsStoreQuery {
  /** The earliest capture time read, ISO 8601, inclusive. */
  readonly from: string;

  /** The capture time the window ends at, ISO 8601, exclusive. */
  readonly to: string;

  /** Only deliveries with one of these names (`AnalyticsDelivery.name`); every name when absent. */
  readonly names?: readonly string[];
}
