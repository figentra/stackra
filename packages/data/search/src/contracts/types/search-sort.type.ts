/**
 * Stackra file contract:
 * Purpose: `SearchSort`, one key a ranked read is ordered by: a `@Searchable` sortable field and its direction.
 * Boundary: a type only. A row sorts by its first value of the path; a row without one sorts last in either direction.
 *           Relevance orders rows the keys leave tied.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); data-layer gap se9 (stackra-302).
 */

/** One sort key. */
export interface SearchSort {
  /** The sortable field's path. */
  readonly path: string;

  /** Smallest first (`asc`) or largest first (`desc`); `asc` when absent. */
  readonly direction?: "asc" | "desc";
}
