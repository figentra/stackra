/**
 * Stackra file contract:
 * Purpose: `IndexOptions`, the options of `@Index(properties, options)`: a unique index, and a partial index's
 *          predicate.
 * Boundary: a type only. The index name is derived by gen (`idx_<table>_<columns>`, ADR 0231), never written.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: `@Index` is a class facet); ADR 0231 (`idx_` names).
 */

/** How an index behaves. */
export interface IndexOptions {
  /** Refuses two rows with the same values; `false` by default. */
  readonly unique?: boolean;

  /** A partial index's SQL predicate over column names (`"deleted_at is null"`). */
  readonly where?: string;
}
