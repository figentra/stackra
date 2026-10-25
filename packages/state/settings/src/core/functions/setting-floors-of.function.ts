/**
 * Stackra file contract:
 * Purpose: `settingFloorsOf`, the bridge from market-pack data to settings: the legal floors of a resolved market on a
 *          date, matched to the setting keys that declare `floor: "<pack key>"`, grouped by settings group. A
 *          `SettingFloorSource` driver calls it with the target's resolved pack.
 * Boundary: pure; floors are pack data (no number here). A key whose pack key has no floor that day has none. A floor
 *           value that is not a number or a boolean cannot bound a setting and throws, so a pack mistake fails loudly.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0363 (decision 4); config-model section 3.
 */
import { floorsOn } from "@stackra/market-packs";
import type { ResolvedPack } from "@stackra/market-packs";

import type { SettingFloor } from "#contracts/index";
import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";
import type { SettingKey } from "#core/types/setting-key.type";

/**
 * The floors on `keys` in `resolved` on `on`, by group.
 *
 * @throws TypeError when a matched floor's value is neither a number nor a boolean.
 * @example
 * const floors = settingFloorsOf(resolvePack(...), "2026-10-25", Object.values(Settings.orders)).get("orders") ?? [];
 */
export function settingFloorsOf(
  resolved: ResolvedPack,
  on: string,
  keys: readonly SettingKey[],
): ReadonlyMap<string, readonly SettingFloor[]> {
  const byPackKey = new Map(floorsOn(resolved, on).map((value) => [value.key, value]));
  const out = new Map<string, SettingFloor[]>();
  for (const key of keys) {
    const found = key.floor === undefined ? undefined : byPackKey.get(key.floor);
    if (found?.floor === undefined) continue;
    if (typeof found.value !== "number" && typeof found.value !== "boolean")
      throw new TypeError(
        `The floor ${found.key} of market ${found.market} is not a number or a boolean, so it cannot bound ${key.path}`,
      );
    const floors = out.get(key.module) ?? [];
    floors.push({
      path: settingPathInGroup(key),
      value: found.value,
      bound: found.floor.bound,
      law: found.floor.law,
      market: found.market,
      version: found.version,
    });
    out.set(key.module, floors);
  }
  return out;
}
