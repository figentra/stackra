/**
 * Stackra file contract:
 * Purpose: `brand<B>()`, which makes the one constructor of a `Branded` type.
 * Boundary: a pure function with no runtime check: the constructor returns its argument. The caller validates first
 *           (the pipeline already did for an input); the brand only stops one id being passed for another.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 7), ADR 0127 2026-10-24 note (the leaf vocabulary).
 */
import type { Branded } from "#core/types/branded.type";

/**
 * Returns the constructor of the branded type `B`, taking exactly `B`'s base type.
 *
 * @example
 * export const memberId = brand<MemberId>(); // (value: string) => MemberId
 * const member = memberId(ctx.actor.id);
 */
export function brand<B extends Branded<unknown, string>>(): (
  value: B extends { readonly "~brand": { readonly base: infer T } } ? T : never,
) => B {
  return (value) => value as B;
}
