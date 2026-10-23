/**
 * Stackra file contract:
 * Purpose: drops the keys of a props object whose value is `undefined`, so an optional contract prop that was left
 *          out reaches HeroUI as an absent prop, not as an explicit `undefined` (which its types refuse under
 *          `exactOptionalPropertyTypes`, and which would override a HeroUI default at runtime).
 * Boundary: pure; a shallow copy, nothing else is changed.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: unknown props pass through, typed); ADR 0303 (decision 7).
 */

/** The props with `undefined` taken out of each value's type, the keys staying optional. */
export type DefinedProps<T extends object> = { [K in keyof T]: Exclude<T[K], undefined> };

/**
 * A shallow copy of `props` without the keys whose value is `undefined`.
 * @param props - the props a wrapper holds for HeroUI, some of them possibly left out by its caller
 * @returns the same props with the left-out ones absent
 */
export function omitUndefined<T extends object>(props: T): DefinedProps<T> {
  // A cast: the filtered entries have exactly the keys of `DefinedProps`, which TypeScript cannot derive from a filter.
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as DefinedProps<T>;
}
