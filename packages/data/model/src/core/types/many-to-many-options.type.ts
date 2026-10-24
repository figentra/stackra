/**
 * Stackra file contract:
 * Purpose: `ManyToManyOptions`, the options of `@ManyToMany(() => Target, options)`: the pivot table's name.
 * Boundary: a type only. The declaring side owns the pivot table, which lives in the module's Postgres schema; without
 *           a name gen derives `<table>_<target table>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 11 and 27); ADR 0231 (snake_case plural tables).
 */

/** How a many-to-many behaves. */
export interface ManyToManyOptions {
  /** The pivot table, snake_case, without the schema (`product_collection_items`). */
  readonly pivotTable?: string;
}
