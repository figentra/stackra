/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/i18n, which has several public files, until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `I18nConfig` lives in the `src/config/` entry folder;
 *           `I18nOptions`, `intlLocale`, `checkI18nOptions` and the catalogue and key-tree types stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { I18nConfig } from "#config/i18n.config";
export { I18nConfig$ } from "#core/constants/i18n-config-schema.constant";
export { Locale } from "#core/enums/locale.enum";
export { LocaleUrlStrategy } from "#core/enums/locale-url-strategy.enum";
export { NumberingSystem } from "#core/enums/numbering-system.enum";
export { formatMessage } from "#core/functions/format-message.function";
export { keys } from "#core/functions/keys.function";
export { mergeCatalogues } from "#core/functions/merge-catalogues.function";
export type { I18nKey } from "#core/types/i18n-key.type";
export type { LoadCatalogue } from "#core/types/load-catalogue.type";
