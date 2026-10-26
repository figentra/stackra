/**
 * Stackra file contract:
 * Purpose: `unentitledSettingPaths`, the paths of `values` the holder's plan does not unlock: a key whose own
 *          entitlement is not granted, or a value whose gated entitlement is not granted.
 * Boundary: internal and pure. `values` is keyed by path in the group (`cancellation.window`); a path with no key in
 *           `keys` is not gated. A gated value is matched by its text (`String(value)`), so value gates fit scalar
 *           settings (an enum, a number, a boolean). Readers drop these paths so the default applies; writers refuse
 *           them.
 * Runtime: isomorphic
 * Governing contract: ADR 0420 (decisions 1 and 3).
 */
import type { SettingValue } from "#contracts/index";
import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";
import type { SettingKey } from "#core/types/setting-key.type";

/**
 * The paths of `values` not unlocked by `granted`.
 *
 * @example
 * unentitledSettingPaths({ sessionLength: "unlimited" }, keys, new Set()); // ["sessionLength"]
 */
export function unentitledSettingPaths(
  values: Readonly<Record<string, SettingValue>>,
  keys: readonly SettingKey[],
  granted: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const key of keys) {
    const path = settingPathInGroup(key);
    if (!Object.hasOwn(values, path)) continue;
    const byValue = key.entitlementValues?.[String(values[path])];
    if (
      (key.entitlement !== undefined && !granted.has(key.entitlement)) ||
      (byValue !== undefined && !granted.has(byValue))
    )
      out.push(path);
  }
  return out;
}
