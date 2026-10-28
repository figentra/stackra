/**
 * Stackra file contract:
 * Purpose: `BULK_LIMITS`, the sizes of the bulk verbs of `CrudService`: the default and largest batch `each` and `chunk`
 *          read (and `upsert` matches, and an encrypted `updateWhere` rewrites) at a time, and the largest offset page.
 * Boundary: internal to `CrudService`. A batch is one keyset read of at most `maxBatch` rows, so a walk over a large
 *           table never holds more than one batch in one statement.
 * Runtime: node
 * Governing contract: data-layer gaps mo9 and mo14 (stackra-280); ADR 0097 (decision 4).
 */

/** The bulk-verb sizes. */
export const BULK_LIMITS = {
  /** The rows one batch reads when the caller names none. */
  batch: 500,
  /** The most rows one batch may read. */
  maxBatch: 10_000,
  /** The most rows one offset page may hold. */
  maxPerPage: 500,
} as const;
