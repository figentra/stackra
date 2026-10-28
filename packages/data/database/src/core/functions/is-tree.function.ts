/**
 * Stackra file contract:
 * Purpose: `isTree(model)`, whether a model carries the `HasTree` trait, read from `traitsOf`.
 * Boundary: pure; never instantiates the model.
 * Runtime: node
 * Governing contract: ADR 0321 (`HasTree`); data-layer gap mo16.
 */
import { traitsOf } from "@stackra/model";

/**
 * Whether rows of `model` form a tree.
 *
 * @example
 * isTree(Category); // true
 */
export function isTree(model: object): boolean {
  return traitsOf(model).some((trait) => trait.name === "has_tree");
}
