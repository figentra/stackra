/**
 * Stackra file contract:
 * Purpose: `PruneReport`, what one `pruneRecords` run did to a model's rows: how many expired rows it archived or
 *          soft-deleted, how many it deleted for good, and how many a legal hold kept.
 * Boundary: a type only, counts only.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decision 3); ADR 0189 (decision 4); data-layer gap gov4.
 */

/** One model's prune. */
export interface PruneReport {
  /** The model's class name. */
  readonly model: string;

  /** Expired rows archived or soft-deleted by its `Retention` policy. */
  readonly expired: number;

  /** Rows deleted for good: a `hard` policy's, and soft-deleted rows past the 30-day window. */
  readonly purged: number;

  /** Rows a legal hold kept from a delete. */
  readonly held: number;
}
