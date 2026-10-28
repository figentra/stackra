/**
 * Stackra file contract:
 * Purpose: `isAppendOnly(model)`, whether a model carries the `AppendOnly` trait, read once from `traitsOf` for
 *          `CrudService` and `AppendOnlySubscriber`.
 * Boundary: internal; pure over the trait registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (data invariants); ADR 0321 (trait inventory).
 */
import { traitsOf } from "@stackra/model";

/**
 * Whether rows of `model` are never changed once inserted.
 *
 * @example
 * isAppendOnly(LedgerEntry); // true
 */
export function isAppendOnly(model: object): boolean {
  return traitsOf(model).some((trait) => trait.name === "append_only");
}
