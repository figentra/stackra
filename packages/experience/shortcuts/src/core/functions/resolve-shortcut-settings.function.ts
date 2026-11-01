/**
 * Stackra file contract:
 * Purpose: `resolveShortcutSettings`, the shortcut settings in force: the platform default, then each layer in order
 *          (tenant from the dashboard, then the person), where a field a layer locked cannot be changed by the
 *          layers after it. Remaps merge per action id.
 * Boundary: pure; runtime configuration only (ADR 0496). A missing layer is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (three settings layers); ADR 0496.
 */
import { DEFAULT_SHORTCUT_SETTINGS } from "#core/constants/default-shortcut-settings.constant";
import type { ShortcutSettingName } from "#core/types/shortcut-setting-name.type";
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";
import type { ShortcutSettingsLayer } from "#core/types/shortcut-settings-layer.type";

/**
 * The settings in force.
 *
 * @example
 * resolveShortcutSettings(
 *   { hintMode: "hidden", locked: ["hintMode"] }, // tenant
 *   { hintMode: "visible", singleKey: false }, // person: hint mode ignored, locked
 * ); // { enabled: true, hintMode: "hidden", singleKey: false, remaps: {}, locked: ["hintMode"] }
 */
export function resolveShortcutSettings(
  ...layers: readonly (ShortcutSettingsLayer | undefined)[]
): ShortcutSettings {
  let settings: ShortcutSettings = DEFAULT_SHORTCUT_SETTINGS;
  for (const layer of layers) {
    if (layer === undefined) continue;
    const { locked } = settings;
    const open = (name: ShortcutSettingName) => !locked.includes(name);
    settings = {
      enabled: open("enabled") && layer.enabled !== undefined ? layer.enabled : settings.enabled,
      hintMode:
        open("hintMode") && layer.hintMode !== undefined ? layer.hintMode : settings.hintMode,
      singleKey:
        open("singleKey") && layer.singleKey !== undefined ? layer.singleKey : settings.singleKey,
      remaps:
        open("remaps") && layer.remaps !== undefined
          ? { ...settings.remaps, ...layer.remaps }
          : settings.remaps,
      locked: [...new Set([...settings.locked, ...(layer.locked ?? [])])],
    };
  }
  return settings;
}
