/**
 * Stackra file contract:
 * Purpose: `createTrait`, the one way to make a model trait (ADR 0096 decision 1): a named function from the class
 *          composed so far to a subclass that adds fields, recorded in the trait registry so `traitsOf` can list it.
 *          The traits of this package are made with it, and a package that owns a trait (`Searchable` behaviour in
 *          search, `HasMedia` in media) makes its trait with it too.
 * Boundary: checks the name and that `apply` returns a direct subclass of the class it was given, then records the
 *           trait; it never runs a model constructor. A trait adds fields with initializers and getters only (ADR 0294
 *           decision 27).
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decisions 1, 2 and 4; consequence: the trait registry); ADR 0294 (decision 27).
 */
import type { Model } from "#core/bases/model.base";
import { TRAIT_RECORDS } from "#core/constants/trait-records.constant";
import type { ModelClass } from "#core/types/model-class.type";
import type { Trait } from "#core/types/trait.type";

/** A trait code: snake_case, starting with a letter. */
const TRAIT_NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * Makes a trait.
 *
 * @param name - the trait's code, snake_case (`has_public_id`).
 * @param apply - returns `class extends base { ... }` with the trait's fields.
 * @param options - what the trait was made with, kept in the registry for gen (`{ prefix: "ord" }`).
 * @returns the trait, to pass to `Model.with`.
 * @throws TypeError when `name` is not snake_case, or (when applied) `apply` does not return a direct subclass of the
 *         class it was given.
 * @example
 * export const SoftDeletes = createTrait("soft_deletes", (base) =>
 *   class extends base {
 *     deletedAt: Date | null = null;
 *   },
 * );
 */
export function createTrait<I extends object>(
  name: string,
  apply: (base: ModelClass) => ModelClass<Model & I>,
  options: Readonly<Record<string, unknown>> = {},
): Trait<I> {
  if (!TRAIT_NAME.test(name)) throw new TypeError(`"${name}" is not a snake_case trait name`);
  const record = Object.freeze({ name, options: Object.freeze({ ...options }) });
  const trait = (base: ModelClass): ModelClass<Model & I> => {
    const applied = apply(base);
    if (Object.getPrototypeOf(applied) !== base)
      throw new TypeError(
        `The trait "${name}" must return a class that extends the class it is given`,
      );
    TRAIT_RECORDS.set(applied, record);
    return applied;
  };
  return Object.assign(trait, { traitName: name, options: record.options });
}
