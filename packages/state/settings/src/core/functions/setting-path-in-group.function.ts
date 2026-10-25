/**
 * Stackra file contract:
 * Purpose: `settingPathInGroup`, a key's path relative to its group: `<section>.<name>`, or `<name>` outside a
 *          section; the path a store, a floor and a revision use.
 * Boundary: pure. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22: sections one level deep).
 */
import type { SettingKey } from "#core/types/setting-key.type";

/**
 * The path of `key` in its group.
 *
 * @example
 * settingPathInGroup(Settings.orders.customersMayCancel); // "cancellation.customersMayCancel"
 */
export function settingPathInGroup(key: Pick<SettingKey, "name" | "section">): string {
  return key.section === undefined ? key.name : `${key.section}.${key.name}`;
}
