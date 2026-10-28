/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/i18n, which has several public files, until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `I18nConfig` lives in the `src/config/` entry folder;
 *           `I18nOptions`, `intlLocale`, `checkI18nOptions`, `Catalogue` and the key-tree types stay internal;
 *           `Messages` is public as `loadMessages`' result (STA-1309).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { I18nConfig } from "#config/i18n.config";
export { I18nConfig$ } from "#core/constants/i18n-config-schema.constant";
export { DisplayUnit } from "#core/enums/display-unit.enum";
export { HourCycle } from "#core/enums/hour-cycle.enum";
export { LengthUnit } from "#core/enums/length-unit.enum";
export { Locale } from "#core/enums/locale.enum";
export { LocaleUrlStrategy } from "#core/enums/locale-url-strategy.enum";
export { NativeSwitcher } from "#core/enums/native-switcher.enum";
export { NumberingSystem } from "#core/enums/numbering-system.enum";
export { countryName } from "#core/functions/country-name.function";
export { formatAddress } from "#core/functions/format-address.function";
export { formatLength } from "#core/functions/format-length.function";
export { formatQuantity } from "#core/functions/format-quantity.function";
export { formatMessage } from "#core/functions/format-message.function";
export { keys } from "#core/functions/keys.function";
export { loadMessages } from "#core/functions/load-messages.function";
export { localeFormat } from "#core/functions/locale-format.function";
export { matchDeviceLocale } from "#core/functions/match-device-locale.function";
export { mergeCatalogues } from "#core/functions/merge-catalogues.function";
export { nativeSwitcherMode } from "#core/functions/native-switcher-mode.function";
export { normalizeArabic } from "#core/functions/normalize-arabic.function";
export { regionFormat } from "#core/functions/region-format.function";
export { startingLocale } from "#core/functions/starting-locale.function";
export { withDigits } from "#core/functions/with-digits.function";
export type { DeviceRegion } from "#core/types/device-region.type";
export type { I18nKey } from "#core/types/i18n-key.type";
export type { LoadCatalogue } from "#core/types/load-catalogue.type";
export type { LocaleFormat } from "#core/types/locale-format.type";
export type { Messages } from "#core/types/messages.type";
export type { RegionFormat } from "#core/types/region-format.type";
export type { StartingLocaleInput } from "#core/types/starting-locale-input.type";
