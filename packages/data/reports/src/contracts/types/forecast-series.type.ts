/**
 * Stackra file contract:
 * Purpose: `ForecastSeries`, one history to forecast: an id the caller chooses, and its timestamps and values.
 * Boundary: a type only; ids and numbers, never a name or personal data. Timestamps are ISO 8601 strings in time order
 *           and equal in length to `values`.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0294 (decision 15: the leaf entry).
 */

/** One series of history. */
export interface ForecastSeries {
  /** The caller's id for the series (an item and location), echoed on its forecast rows. */
  readonly id: string;

  /** ISO 8601 timestamps, oldest first, one per value. */
  readonly timestamps: readonly string[];

  /** The observed values, finite numbers. */
  readonly values: readonly number[];
}
