/**
 * Stackra file contract:
 * Purpose: `settingsPage(key, { scope, panels })`, which builds one generated settings page of a member's
 *          `#stackra/settings` (`SettingsPages.orders`) with the keys `settingKeys` declared for its module.
 * Boundary: reads the keys when the page is built and freezes them into it, so a page is self-contained data; a
 *           module with no keys is a gen mistake and is refused at import.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 24); registry v3.1 section 5 (gen emits the settings pages).
 */
import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";
import type { SettingsPage } from "#core/types/settings-page.type";
import type { SettingsPageOptions } from "#core/types/settings-page-options.type";

/**
 * The page of module `key`.
 *
 * @throws TypeError when `settingKeys` declared no keys for `key`.
 * @example
 * export const SettingsPages = {
 *   messages: settingsPage("messages", { scope: SettingScope.User }),
 * } as const;
 */
export function settingsPage<const K extends string>(
  key: K,
  options: SettingsPageOptions,
): SettingsPage<K> {
  const fields = SETTING_KEY_REGISTRY.get(key);
  if (fields === undefined)
    throw new TypeError(
      `settingsPage("${key}"): settingKeys declared no keys for the module ${key}`,
    );
  return Object.freeze({
    key,
    scope: options.scope,
    panels: Object.freeze([...(options.panels ?? [])]),
    fields,
  });
}
