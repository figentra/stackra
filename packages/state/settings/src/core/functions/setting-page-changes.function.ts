/**
 * Stackra file contract:
 * Purpose: `settingPageChanges`, the check every page write runs first: each name must be a key of the page, its value
 *          must fit the key, and the key's `scopes` must hold the level written (the page's, or `user` for a user's own
 *          layer); the accepted values come back by path in the group, with their keys.
 * Boundary: pure apart from the throw; nothing is written. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 24).
 */
import type { SettingTarget, SettingValue } from "#contracts/index";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingScopeRefusedError } from "#core/errors/setting-scope-refused.error";
import { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";
import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingsPage } from "#core/types/settings-page.type";

/**
 * The values of a page write by path, and the keys they belong to.
 *
 * @throws SettingValueInvalidError naming every unknown name and every value that breaks its key.
 * @throws SettingScopeRefusedError naming every written key whose `scopes` leave out the level written; nothing is
 *         written.
 * @example
 * const { changes } = settingPageChanges(SettingsPages.orders, { acceptingOrders: false });
 */
export function settingPageChanges(
  page: SettingsPage,
  values: Readonly<Record<string, unknown>>,
  target: SettingTarget = {},
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
  // A key's scopes (its class's, narrowed by `@Setting({ scopes })`) name the levels that may hold it.
  const level = target.user === undefined ? page.scope : SettingScope.User;
  const outside = keys.filter((key) => !key.scopes.includes(level)).map(settingPathInGroup);
  if (outside.length > 0)
    throw SettingScopeRefusedError.create(
      { level, paths: outside },
      { fieldErrors: Object.fromEntries(outside.map((path) => [path, "setting_scope_refused"])) },
    );
  return { changes, keys };
}
