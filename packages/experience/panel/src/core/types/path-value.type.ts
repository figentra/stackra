/**
 * Stackra file contract:
 * Purpose: `PathValue<T, P>`, the type at the dotted path `P` of `T`.
 * Boundary: a type only; `never` for a path `T` does not have.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: dotted paths are typed).
 */

/**
 * The type at `P` in `T`.
 *
 * @example
 * type Total = PathValue<{ totals: { totalMinor: number } }, "totals.totalMinor">; // number
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<NonNullable<T[K]>, Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
