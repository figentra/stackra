/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/settings (the `Settings` kind, `@Setting`, the scope and type
 *          enums, the reader, the memory store, the refusals and the generated-key helpers) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The port and its types are the `./contracts` entry's and are not
 *           re-exported here (one symbol, one entry). The layer, lock, value and key-derivation functions and the key
 *           registry stay internal. Isomorphic: nothing here touches a database, a DOM or a Node API.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Settings } from "#core/bases/settings.base";
export { Setting } from "#core/decorators/setting.decorator";
export { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
export { SettingScope } from "#core/enums/setting-scope.enum";
export { SettingType } from "#core/enums/setting-type.enum";
export { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";
export { SettingsLockedError } from "#core/errors/settings-locked.error";
export { settingKeys } from "#core/functions/setting-keys.function";
export { settingsPage } from "#core/functions/settings-page.function";
export { SettingsReader } from "#core/services/settings-reader.service";
export type { SettingKey } from "#core/types/setting-key.type";
export type { SettingKeyInput } from "#core/types/setting-key-input.type";
export type { SettingKeys } from "#core/types/setting-keys.type";
export type { SettingLevel } from "#core/types/setting-level.type";
export type { SettingOptions } from "#core/types/setting-options.type";
export type { SettingsClass } from "#core/types/settings-class.type";
export type { SettingsNavigation } from "#core/types/settings-navigation.type";
export type { SettingsOptions } from "#core/types/settings-options.type";
export type { SettingsPage } from "#core/types/settings-page.type";
export type { SettingsPageOptions } from "#core/types/settings-page-options.type";
export type { SettingsRule } from "#core/types/settings-rule.type";
export type { SettingsRules } from "#core/types/settings-rules.type";
export type { SettingsSnapshot } from "#core/types/settings-snapshot.type";
