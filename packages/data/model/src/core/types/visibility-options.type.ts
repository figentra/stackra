/**
 * Stackra file contract:
 * Purpose: `VisibilityOptions`, what `@Visibility` declares: the record attributes a visibility rule may test, and the
 *          many-to-one relations whose record governs this one.
 * Boundary: a type only. Attributes are the model's own top-level fields (a rule names them `record.<attribute>`);
 *           each needs an index, since every read of the model carries a predicate on them (ADR 0333 consequences). A
 *           followed relation is a `Ref` inside the module: a record is visible only when its related record is (ADR
 *           0333, the 2026-10-24 amendment). Gen checks both lists against the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decisions 1, 2 and 4, and its amendment); ADR 0331 (decision 4: fact sources).
 */

/** The record visibility a model declares. */
export interface VisibilityOptions {
  /** The fields visibility rules may test, as camelCase property names (`collection`, `status`). */
  readonly attributes?: readonly string[];

  /** The many-to-one relations whose record must be visible too (`matter` on a document). */
  readonly follows?: readonly string[];
}
