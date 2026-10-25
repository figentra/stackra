/**
 * Stackra file contract:
 * Purpose: `visibleSettingFields`, the keys of a settings page a mode shows: all of them in developer mode, the ones
 *          marked `essential` in normal mode.
 * Boundary: pure; display only, never an access check.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 1 and 2).
 */
import { SettingsMode } from "#core/enums/settings-mode.enum";
import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingsPage } from "#core/types/settings-page.type";

/**
 * The fields of `page` that `mode` shows, in declaration order.
 *
 * @example
 * const fields = visibleSettingFields(SettingsPages.orders, user.developerMode ? SettingsMode.Developer : SettingsMode.Normal);
 */
export function visibleSettingFields(
  page: SettingsPage,
  mode: SettingsMode,
): readonly SettingKey[] {
  return mode === SettingsMode.Developer
    ? page.fields
    : page.fields.filter((field) => field.essential === true);
}
