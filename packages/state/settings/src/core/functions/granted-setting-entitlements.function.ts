/**
 * Stackra file contract:
 * Purpose: `grantedSettingEntitlements`, the one read of the entitlement port per settings read or write: it collects
 *          the entitlements `keys` name (the key's own and each gated value's) and asks the source which the holder
 *          at `target` is granted.
 * Boundary: internal. No named entitlement asks nothing. With no source bound every named entitlement counts as not
 *           granted, so a gated value never leaks because a deployment forgot the driver (fail closed, ADR 0420 d2).
 * Runtime: isomorphic
 * Governing contract: ADR 0420 (decisions 1 and 2).
 */
import type { SettingEntitlementSource, SettingTarget } from "#contracts/index";
import type { SettingKey } from "#core/types/setting-key.type";

/** No grant. */
const NONE: ReadonlySet<string> = new Set();

/**
 * The granted entitlements among those `keys` name.
 *
 * @example
 * const granted = await grantedSettingEntitlements(this.entitlements, page.fields, target);
 */
export async function grantedSettingEntitlements(
  source: SettingEntitlementSource | undefined,
  keys: readonly SettingKey[],
  target: SettingTarget,
): Promise<ReadonlySet<string>> {
  const named = new Set<string>();
  for (const key of keys) {
    if (key.entitlement !== undefined) named.add(key.entitlement);
    for (const entitlement of Object.values(key.entitlementValues ?? {})) named.add(entitlement);
  }
  if (named.size === 0 || source === undefined) return NONE;
  return source.granted([...named].sort(), target);
}
