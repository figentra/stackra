/**
 * Stackra file contract:
 * Purpose: `OneToManyOptions`, the options of `@OneToMany(() => Target, inverse, options)`: whether a child removed
 *          from the collection is deleted.
 * Boundary: a type only; the foreign key lives on the child's many-to-one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 11 and 27).
 */

/** How a one-to-many behaves. */
export interface OneToManyOptions {
  /** Deletes a child removed from the collection; `false` by default. */
  readonly orphanRemoval?: boolean;
}
