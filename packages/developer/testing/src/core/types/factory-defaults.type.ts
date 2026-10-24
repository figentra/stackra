/**
 * Stackra file contract:
 * Purpose: `FactoryDefaults<T>`: the defaults `factory<T>()` takes, one per field, each a value or a generator of
 *          the build index.
 * Boundary: a public type of the `.` entry; plain data shapes only, no model or row.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2: generic factories); ADR 0294 (rule R8).
 */

/**
 * Every field of `T` (an optional one may be left out): a fixed value, or a function of the build index (`0` for
 * `build()`, `0..n-1` for `buildMany(n)`) called once per built object. A function default is always called, so a
 * field whose type is itself a function takes a generator that returns it.
 */
export type FactoryDefaults<T> = {
  readonly [K in keyof T]: T[K] | ((index: number) => T[K]);
};
