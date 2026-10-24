/**
 * Stackra file contract:
 * Purpose: `factory<T>(defaults)`: a builder of plain test data (port DTOs, values) with per-field overrides and
 *          index-numbered generators; the base of every `*.fixture.ts` file.
 * Boundary: plain objects only. Model rows use the `Factory` kind of @stackra/database, never this (ADR 0294
 *           2026-10-23 item 12).
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2: generic factories live in `.`).
 */
import type { FactoryDefaults } from "#core/types/factory-defaults.type";
import type { FixtureBuilder } from "#core/types/fixture-builder.type";

/**
 * Makes a builder for `T`. A default that is a function is called with the build index for each object; an
 * overridden field skips its default entirely. Builds are deterministic: `build()` always uses index 0.
 *
 * @param defaults - a value or an index generator for every field of `T`.
 * @returns the builder, with `build` and `buildMany`.
 * @throws RangeError from `buildMany` when `count` is negative or not a whole number.
 * @example
 * const entry = factory<Entry>({ points: 100, reference: (i) => `ord_${i}`, at: () => new Date() });
 * entry.build({ points: -50 });
 * entry.buildMany(3); // references ord_0, ord_1, ord_2
 */
export function factory<T>(defaults: FactoryDefaults<T>): FixtureBuilder<T> {
  const buildAt = (index: number, overrides: Partial<T> = {}): T => {
    const built: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(defaults)) {
      if (Object.hasOwn(overrides, key)) continue;
      built[key] =
        typeof value === "function" ? (value as (index: number) => unknown)(index) : value;
    }
    return { ...built, ...overrides } as T;
  };
  return {
    build: (overrides) => buildAt(0, overrides),
    buildMany: (count, overrides) => {
      if (!Number.isInteger(count) || count < 0)
        throw new RangeError(`factory: buildMany count must be a whole number, got ${count}`);
      return Array.from({ length: count }, (_, index) => buildAt(index, overrides));
    },
  };
}
