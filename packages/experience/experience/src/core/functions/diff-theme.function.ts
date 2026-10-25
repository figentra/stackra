/**
 * Stackra file contract:
 * Purpose: `diffTheme(before, after)`, the section and setting keys that differ between two themes, for the reviewed
 *          diff before a publish or a rollback.
 * Boundary: pure; compares by JSON value, so a reordered object is not a change. Keys in code-unit order.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decision 4); ADR 0270 (decision 2).
 */
import { sameJson } from "#core/functions/same-json.function";
import type { Theme } from "#core/types/theme.type";
import type { ThemeDiff } from "#core/types/theme-diff.type";

/** The keys of `left` and `right` whose values differ. */
function changed(
  left: Readonly<Record<string, unknown>>,
  right: Readonly<Record<string, unknown>>,
) {
  return [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .filter(
      (key) =>
        Object.hasOwn(left, key) !== Object.hasOwn(right, key) || !sameJson(left[key], right[key]),
    )
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * What differs from `before` to `after`.
 *
 * @example
 * diffTheme(live.theme, draft); // { sections: ["header"], settings: ["accent_color"] }
 */
export function diffTheme(before: Theme, after: Theme): ThemeDiff {
  return {
    sections: changed(before.sections, after.sections),
    settings: changed(before.settings, after.settings),
  };
}
