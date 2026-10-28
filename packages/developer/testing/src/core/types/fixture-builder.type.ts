/**
 * Stackra file contract:
 * Purpose: `FixtureBuilder<T>`: what `factory<T>()` returns: `build` for one object, `buildMany` for a numbered list.
 * Boundary: a public type of the `.` entry. Named a builder, not a factory, because `Factory` is the database kind
 *           base (ADR 0294 2026-10-23 item 12).
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2); ADR 0294 (rule R8, 2026-10-23 item 11: kind base names are reserved).
 */

/** Builds plain test data from the defaults given to `factory<T>()`. */
export interface FixtureBuilder<T> {
  /**
   * One object at build index 0; each field of `overrides` replaces its default, whose generator is then not called.
   *
   * @param overrides - fields to set instead of their defaults.
   */
  build: (overrides?: Partial<T>) => T;

  /**
   * `count` objects at build indexes `0..count-1`, each with the same `overrides`.
   *
   * @param count - how many objects; a whole number, zero or more.
   * @param overrides - fields to set on every object instead of their defaults.
   */
  buildMany: (count: number, overrides?: Partial<T>) => T[];
}
