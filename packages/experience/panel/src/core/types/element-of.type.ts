/**
 * Stackra file contract:
 * Purpose: `ElementOf<V>`, the item type of a list (an array or any iterable collection).
 * Boundary: a type only; `never` for a value that is not a list.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: list entries and repeaters take the item's paths).
 */

/**
 * The item type of `V`.
 *
 * @example
 * type Line = ElementOf<readonly OrderLineView[]>; // OrderLineView
 */
export type ElementOf<V> = V extends readonly (infer E)[]
  ? E
  : V extends Iterable<infer E>
    ? E
    : never;
