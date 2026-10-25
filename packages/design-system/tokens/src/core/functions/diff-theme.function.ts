/**
 * Stackra file contract:
 * Purpose: the changes between a base theme and a theme: the leaves of `theme` that differ from `base`, at every
 *          depth, and nothing else. The "changes only" export carries it and `mergeTheme` applies it.
 * Boundary: pure; compares plain JSON values (strings, numbers, objects), so a theme's arrays and functions, of which
 *          it has none, are not followed.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The parts of `next` that differ from `previous`, or `undefined` when nothing does. */
function changes(previous: unknown, next: unknown): unknown {
  if (!isRecord(previous) || !isRecord(next)) return Object.is(previous, next) ? undefined : next;
  const changed = Object.entries(next).flatMap(([key, value]) => {
    const change = changes(previous[key], value);
    return change === undefined ? [] : [[key, change] as const];
  });
  return changed.length === 0 ? undefined : Object.fromEntries(changed);
}

/** The leaves of `theme` that differ from `base`; an empty object when the two are the same. */
export function diffTheme(base: Theme, theme: Theme): ThemeDiff {
  return (changes(base, theme) ?? {}) as ThemeDiff;
}
