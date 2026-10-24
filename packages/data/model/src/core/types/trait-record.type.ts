/**
 * Stackra file contract:
 * Purpose: `TraitRecord`, what the trait registry keeps for one applied trait: its snake_case name and the options it
 *          was given (`{ prefix: "ord" }` for `HasPublicId("ord")`).
 * Boundary: a type only; the record and its options are frozen.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decisions 1 and 4); ADR 0231 (snake_case machine codes).
 */

/** One trait applied to a model. */
export interface TraitRecord {
  /** The trait's code, snake_case (`has_public_id`, `soft_deletes`). */
  readonly name: string;

  /** The options the trait was made with; `{}` for a trait that takes none. */
  readonly options: Readonly<Record<string, unknown>>;
}
