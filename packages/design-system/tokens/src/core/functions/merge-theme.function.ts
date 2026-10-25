/**
 * Stackra file contract:
 * Purpose: applies a changes-only diff to a base theme and checks the result: each leaf of `diff` replaces the base's
 *          at the same path, everything else stays. The import of a "changes only" export runs through it.
 * Boundary: pure. The diff may come from a file a person pasted, so it is untrusted: only plain objects are followed,
 *          `__proto__`, `constructor` and `prototype` keys are dropped, and `defineTheme` checks every value of the
 *          result against its grammar.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { defineTheme } from "#core/functions/define-theme.function";

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** `base` with every leaf of `diff` in place. */
function merge(base: unknown, diff: unknown): unknown {
  if (!isRecord(diff)) return diff;
  const result: Record<string, unknown> = isRecord(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(diff))
    if (!UNSAFE_KEYS.has(key)) result[key] = merge(result[key], value);
  return result;
}

/**
 * `base` with `diff` applied, checked.
 *
 * @throws InvalidThemeError when the result is not a usable theme
 */
export function mergeTheme(base: Theme, diff: ThemeDiff): Theme {
  return defineTheme(merge(base, diff) as Theme);
}
