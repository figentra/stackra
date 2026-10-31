/**
 * Stackra file contract:
 * Purpose: `Same<A, B>`, `true` when each type is assignable to the other: the comparison a generated `X$Check` makes
 *          between a compiled schema's output and the class's fields.
 * Boundary: a type only. Mutual assignability, not identity, so a brand cast on both sides and `?:` written either way
 *           compare equal; tuples keep unions from distributing. `readonly` on an array, at any depth, is ignored: a
 *           class declares `recipients: readonly string[]` while zod outputs `string[]`, and both are the same data
 *           (STA-1682). Optional and nullable still count; functions and dates are compared as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `X$Check`); the STA-335 type-to-schema spike.
 */

/**
 * `true` when `A` and `B` are mutually assignable, otherwise `false`.
 *
 * @example
 * type Ok = Same<{ id: string }, { id: string }>; // true
 */
export type Same<A, B> = [Loose<A>] extends [Loose<B>]
  ? [Loose<B>] extends [Loose<A>]
    ? true
    : false
  : false;

/**
 * `T` with `readonly` dropped from its arrays, for the comparison only, down to `MaxDepth` levels: a recursive type
 * (`Json`, a shape that holds itself) never ends, which is TS2589 in its `X$Check` (STA-1682).
 */
type Loose<T, D extends readonly unknown[] = []> = D["length"] extends MaxDepth
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends Date
      ? T
      : T extends readonly (infer E)[]
        ? Loose<E, [...D, unknown]>[]
        : T extends object
          ? { [K in keyof T]: Loose<T[K], [...D, unknown]> }
          : T;

/** How deep `Loose` looks: far past any shape's nesting of readonly arrays. */
type MaxDepth = 5;
