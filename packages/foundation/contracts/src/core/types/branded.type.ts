/**
 * Stackra file contract:
 * Purpose: `Branded<T, B>`: a nominal type over a structural one, so two ids or two amounts that share a base type
 *          cannot be passed for each other.
 * Boundary: a type only. The brand exists at compile time: the runtime value is the plain `T`. The brand records its
 *           base so `brand<B>()` can take exactly that base.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 15), ADR 0127 2026-10-24 note (the leaf vocabulary).
 */

/**
 * `T` marked with the name `B`. The one way to make a value of it is the constructor its owner builds with `brand`.
 *
 * @example
 * export type MemberId = Branded<string, "loyalty_kit.MemberId">;
 * const id: MemberId = "usr_x"; // type error: a plain string is not a member id
 */
export type Branded<T, B extends string> = T & {
  /** Type-only: never present at runtime. */
  readonly "~brand": { readonly name: B; readonly base: T };
};
