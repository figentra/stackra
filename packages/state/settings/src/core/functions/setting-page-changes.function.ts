/**
 * Stackra file contract:
 * Purpose: `settingPageChanges`, the check every page write runs first: each name must be a key of the page and its
 *          value must fit the key; the accepted values come back by path in the group, with their keys.
 * Boundary: pure apart from the throw; nothing is written. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 24).
 */
import type { SettingValue } from "#contracts/index";
import { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";
import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingsPage } from "#core/types/settings-page.type";

/**
 * The values of a page write by path, and the keys they belong to.
 *
 * @throws SettingValueInvalidError naming every unknown name and every value that breaks its key.
 * @example
 * const { changes } = settingPageChanges(SettingsPages.orders, { acceptingOrders: false });
 */
export function settingPageChanges(
  page: SettingsPage,
  values: Readonly<Record<string, unknown>>,
): { changes: Record<string, SettingValue>; keys: SettingKey[] } {
  const changes: Record<string, SettingValue> = {};
  const keys: SettingKey[] = [];
  const refused: string[] = [];
  for (const [name, value] of Object.entries(values)) {
    const key = page.fields.find((field) => field.name === name);
    if (key !== undefined && isSettingValue(key, value)) {
      changes[settingPathInGroup(key)] = value;
      keys.push(key);
    } else refused.push(key?.path ?? `${page.key}.${name}`);
  }
  if (refused.length > 0)
    throw SettingValueInvalidError.create(
      { keys: refused },
      { fieldErrors: Object.fromEntries(refused.map((path) => [path, "setting_value_invalid"])) },
    );
  return { changes, keys };
}
