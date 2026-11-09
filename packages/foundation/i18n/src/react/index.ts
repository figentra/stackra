/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/i18n (the provider, the translation, locale and
 *          formatting hooks, and the i18n kit's headless `LocaleSwitcher`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The hooks' named return types are exported, so a consumer's
 *           declarations can name them (`readonly i18n = useTranslation()` in an exported class, no TS4029).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { MoneyFormatter } from "#react/formatting/money-formatter.type";
export { useDateTime } from "#react/formatting/use-date-time";
export { useMoney } from "#react/formatting/use-money";
export { useNumber } from "#react/formatting/use-number";
export { useNumerals } from "#react/formatting/use-numerals";
export { I18nProvider } from "#react/i18n-provider/i18n-provider";
export type { I18nProviderProps } from "#react/i18n-provider/i18n-provider-props.type";
export type { LocaleChoice } from "#react/locale/locale-choice.type";
export type { LocaleState } from "#react/locale/locale-state.type";
export { useLocale } from "#react/locale/use-locale";
export { useLocaleChoice } from "#react/locale/use-locale-choice";
export { LocaleSwitcher } from "#react/locale-switcher/locale-switcher";
export type { LocaleSwitcherProps } from "#react/locale-switcher/locale-switcher.props";
export type { LocaleSwitcherState } from "#react/locale-switcher/locale-switcher-state.type";
export type { Translation } from "#react/translation/translation.type";
export { useTranslation } from "#react/translation/use-translation";
