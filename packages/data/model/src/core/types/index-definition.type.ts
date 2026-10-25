/**
 * Stackra file contract:
 * Purpose: `IndexDefinition`, one index as `@Index` recorded it and `Index.on(Model)` reads it back: the property
 *          paths in order, whether it is unique, and a partial index's predicate.
 * Boundary: a type only; the definition is frozen. Paths are model keys or embedded paths (`total.minor`), checked by
 *           gen against the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 27); ADR 0231 (`idx_` names).
 */

/** One declared index. */
export interface IndexDefinition {
  /** The indexed property paths, in column order. */
  readonly properties: readonly string[];

  /** Whether two rows may not share the values. */
  readonly unique: boolean;

  /** A partial index's SQL predicate, when it has one. */
  readonly where?: string;
}
