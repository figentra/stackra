/**
 * Stackra file contract:
 * Purpose: `DroppedIndexOptions`, what `t.dropIndex(columns, options)` states about the index an earlier migration
 *          built, so the dev inverse builds the same index again without reading the database.
 * Boundary: a type only; literals (the frozen snapshot rule).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (literal snapshots; gen derives every inverse); ADR 0231 (names).
 */
import type { IndexMethod } from "#core/types/index-method.type";

/** The dropped index as it was built. */
export interface DroppedIndexOptions {
  /** Whether it was a unique index. */
  readonly unique?: boolean;

  /** Its access method, when it named one. */
  readonly using?: IndexMethod;

  /** Its partial predicate, when it had one. */
  readonly where?: string;

  /** The table it was built under, when the table was renamed since: a rename keeps the index's `idx_` name. */
  readonly table?: string;
}
