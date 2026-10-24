/**
 * Stackra file contract:
 * Purpose: `SETTING_KEY_REGISTRY`, each module's setting keys in declaration order, so a page built by `settingsPage`
 *          carries the fields `settingKeys` declared for its module.
 * Boundary: module state written only by `settingKeys` and read only by `settingsPage`, both in a member's generated
 *           `#stackra/settings`, which calls `settingKeys` first. A page copies the keys when it is built, so a later
 *           registration for the same module changes no page already built. Not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 24: gen generates the settings page); registry v3.1 section 5.
 */
import type { SettingKey } from "#core/types/setting-key.type";

/** Module key to its keys. */
export const SETTING_KEY_REGISTRY = new Map<string, readonly SettingKey[]>();
