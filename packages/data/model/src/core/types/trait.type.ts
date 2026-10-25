/**
 * Stackra file contract:
 * Purpose: `Trait<I>`, reusable model behaviour made by `createTrait`: given the class composed so far it returns a
 *          subclass whose instances are `I`, and it carries its name and options for the trait registry.
 * Boundary: a type only. A trait adds fields with initializers and getters only, never constructor logic, because the
 *           ORM builds a loaded row without running the constructor (ADR 0294 decision 27).
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decisions 1 and 2); ADR 0294 (decisions 16 and 27).
 */
import type { Model } from "#core/bases/model.base";
import type { ModelClass } from "#core/types/model-class.type";

/**
 * A trait whose application gives instances of `I`.
 *
 * @example
 * export class Order extends Model.with(HasPublicId("ord"), Timestamps) {}
 */
export interface Trait<I extends object = object> {
  /** Returns a subclass of `base` with the trait's fields. */
  (base: ModelClass): ModelClass<Model & I>;

  /** The trait's code, snake_case. */
  readonly traitName: string;

  /** The options it was made with, frozen. */
  readonly options: Readonly<Record<string, unknown>>;
}
