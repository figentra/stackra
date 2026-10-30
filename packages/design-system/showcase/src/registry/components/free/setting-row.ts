/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/setting-row` (Setting row).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Setting row. */
export const FREE_SETTING_ROW: ComponentEntry = {
  slug: "setting-row",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SettingRow",
  parts: ["SettingRow"],
  hero: {},
  examples: [{ id: "pos-settings", card: true }, { id: "with-detail" }, { id: "actions" }],
  related: ["free/switch", "free/list", "free/form-section"],
  tokens: ["color.muted", "color.accent", "motion.base"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["settings", "preference", "toggle", "options tile"],
};
