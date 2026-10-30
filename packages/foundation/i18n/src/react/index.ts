/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/i18n (the provider and the translation, locale and
 *          formatting hooks) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The hooks' return types stay internal; consumers name them by
 *           `ReturnType` when they must.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useDateTime } from "#react/formatting/use-date-time";
export { useMoney } from "#react/formatting/use-money";
export { useNumber } from "#react/formatting/use-number";
export { useNumerals } from "#react/formatting/use-numerals";
export { I18nProvider } from "#react/i18n-provider/i18n-provider";
export type { I18nProviderProps } from "#react/i18n-provider/i18n-provider-props.type";
export { useLocale } from "#react/locale/use-locale";
export { useLocaleChoice } from "#react/locale/use-locale-choice";
export { useTranslation } from "#react/translation/use-translation";
