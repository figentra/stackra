/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/settings-cell` (Settings cell).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Settings cell entry of the component registry. */
export const FREE_SETTINGS_CELL: ComponentEntry = {
  slug: "settings-cell",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SettingsCell",
  parts: [
    "SettingsCell",
    "SettingsSwitchCell",
    "SettingsSelectCell",
    "SettingsSliderCell",
    "SettingsColorCell",
  ],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/item-card", "free/setting-row"],
  tokens: ["color.surface", "color.accent"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["settings", "preferences", "switch", "slider", "colour"],
  status: "new",
};
