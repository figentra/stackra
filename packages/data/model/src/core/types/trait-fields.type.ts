/**
 * Stackra file contract:
 * Purpose: `TraitFields<T>`, the instance type a list of traits gives: the intersection of what each trait adds, so
 *          `Model.with(HasPublicId("ord"), Timestamps)` types `id`, `createdAt` and `updatedAt`.
 * Boundary: a type only. Internal: `Model.with` uses it, consumers read the resulting class.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: `extends Model.with(...traits)`); the STA-335 entity-schema spike.
 */
import type { Trait } from "#core/types/trait.type";

/** The intersection of the members of the union `U`. */
type Intersect<U> = (U extends unknown ? (value: U) => void : never) extends (
  value: infer I,
) => void
  ? I
  : never;

/** The fields the traits `T` add, together. */
export type TraitFields<T extends readonly Trait[]> = Intersect<
  { [K in keyof T]: T[K] extends Trait<infer I> ? I : never }[number]
>;
