/**
 * Stackra file contract:
 * Purpose: `hasMetadata(model)`, whether a model carries the `HasMetadata` trait, read from `traitsOf` for
 *          `CrudService` and `MetadataSubscriber`.
 * Boundary: internal; pure over the trait registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decision 4); data-layer gap mo18.
 */
import { traitsOf } from "@stackra/model";

/**
 * Whether `model` carries `HasMetadata`.
 *
 * @example
 * hasMetadata(Customer); // true
 */
export function hasMetadata(model: object): boolean {
  return traitsOf(model).some((trait) => trait.name === "has_metadata");
}
