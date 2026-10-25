/**
 * Stackra file contract:
 * Purpose: `Same<A, B>`, `true` when each type is assignable to the other: the comparison a generated `X$Check` makes
 *          between a compiled schema's output and the class's fields.
 * Boundary: a type only. Mutual assignability, not identity, so a brand cast on both sides and `?:` written either way
 *           compare equal; tuples keep unions from distributing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `X$Check`); the STA-335 type-to-schema spike.
 */

/**
 * `true` when `A` and `B` are mutually assignable, otherwise `false`.
 *
 * @example
 * type Ok = Same<{ id: string }, { id: string }>; // true
 */
export type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
