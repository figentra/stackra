/**
 * Stackra file contract:
 * Purpose: `ChangeLogReport`, what one maintenance run of the change log did: how many partitions (Postgres) or
 *          entries (memory) it created ahead and dropped as expired.
 * Boundary: a type only, counts only.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: retention by whole partitions).
 */

/** One maintenance run. */
export interface ChangeLogReport {
  /** Partitions created ahead. */
  readonly created: number;

  /** Expired partitions (or memory entries) dropped. */
  readonly dropped: number;
}
