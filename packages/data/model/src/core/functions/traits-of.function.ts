/**
 * Stackra file contract:
 * Purpose: `traitsOf`, which lists the traits a model was composed with, in the order `Model.with` applied them, so
 *          @stackra/database can refuse an update of an `AppendOnly` model and gen can read a trait's options.
 * Boundary: reads the trait registry along the class's constructor chain; never instantiates the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (consequence: @stackra/model owns the trait registry).
 */
import { TRAIT_RECORDS } from "#core/constants/trait-records.constant";
import type { TraitRecord } from "#core/types/trait-record.type";

/**
 * The traits of `type` and its ancestors, the first applied first.
 *
 * @returns an empty array for a class composed with no trait.
 * @example
 * traitsOf(LedgerEntry).map((trait) => trait.name); // ["has_public_id", "append_only"]
 */
export function traitsOf(type: object): readonly TraitRecord[] {
  const records: TraitRecord[] = [];
  for (
    let current: object | null = type;
    current !== null && current !== Function.prototype;
    current = Object.getPrototypeOf(current) as object | null
  ) {
    const record = TRAIT_RECORDS.get(current);
    if (record !== undefined) records.unshift(record);
  }
  return Object.freeze(records);
}
