/**
 * Stackra file contract:
 * Purpose: `RelationSource<M>`, something that builds a row of `M` when its parent is built: a factory in a factory's
 *          `definition` (`order: OrderFactory.new()`), so `Attributes<M>` accepts it in a relation position.
 * Boundary: a type only, matched by the type-only `~builds` brand. @stackra/database's `Factory<M>` declares the brand
 *           (`declare readonly "~builds"?: M`); this package never imports database, which depends on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (factories with states); ADR 0294 (decisions 11 and 16).
 */

/**
 * A builder of `M` rows.
 *
 * @example
 * export abstract class Factory<M extends Model> implements RelationSource<M> {
 *   declare readonly "~builds"?: M;
 * }
 */
export interface RelationSource<M> {
  /** Type-only: never present at runtime. */
  readonly "~builds"?: M;
}
