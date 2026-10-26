/**
 * Stackra file contract:
 * Purpose: `DefinedProps`, the props with `undefined` taken out of each value's type, the keys staying optional.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3: unknown props pass through, typed); ADR 0303
 *                     (decision 7).
 */

/** The props with `undefined` taken out of each value's type, the keys staying optional. */
export type DefinedProps<T extends object> = { [K in keyof T]: Exclude<T[K], undefined> };
