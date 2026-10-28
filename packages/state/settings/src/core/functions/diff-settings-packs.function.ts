/**
 * Stackra file contract:
 * Purpose: `diffSettingsPacks`, what `settings:diff` and a settings promotion show: every path of every group whose
 *          value or lock differs between a base pack and the next one.
 * Boundary: pure; rows come sorted by group, then path, so the same two packs always give the same diff. Values are
 *           compared with `Object.is`.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4); ADR 0280 (decision 4); ADR 0359 (decision 6).
 */
import type { SettingLayer, SettingsPack } from "#contracts/index";
import type { SettingsChange } from "#core/types/settings-change.type";

/** An empty group. */
const NONE: SettingLayer = { values: {}, locked: [] };

/**
 * The rows that turn `base` into `next`.
 *
 * @example
 * diffSettingsPacks(live, sandbox); // [{ group: "orders", path: "refundWindowDays", before: 14, after: 30, ... }]
 */
export function diffSettingsPacks(base: SettingsPack, next: SettingsPack): SettingsChange[] {
  const rows: SettingsChange[] = [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const groups = [...new Set([...Object.keys(base.groups), ...Object.keys(next.groups)])].sort();
  for (const group of groups) {
    const from = base.groups[group] ?? NONE;
    const to = next.groups[group] ?? NONE;
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const paths = [...new Set([...Object.keys(from.values), ...Object.keys(to.values)])].sort();
    for (const path of paths) {
      const had = Object.hasOwn(from.values, path);
      const has = Object.hasOwn(to.values, path);
      const lockedBefore = from.locked.includes(path);
      const lockedAfter = to.locked.includes(path);
      if (
        had === has &&
        Object.is(from.values[path], to.values[path]) &&
        lockedBefore === lockedAfter
      )
        continue;
      rows.push({
        group,
        path,
        ...(had ? { before: from.values[path] ?? null } : {}),
        ...(has ? { after: to.values[path] ?? null } : {}),
        lockedBefore,
        lockedAfter,
      });
    }
  }
  return rows;
}
