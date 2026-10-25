/**
 * Stackra file contract:
 * Purpose: `useLocale()`, the hook a component reads the active locale with: `locale`, `direction` (for a sheet's
 *          side or a logical placement), `endonym(code)` and `setLocale(code)`.
 * Boundary: reads the nearest `I18nProvider`; the direction comes from the member's `I18nConfig.rtl`, the endonym
 *           from the `Locale` case data, so neither depends on the runtime's Intl data.
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0297 (decision 4), ADR 0305 (class components: hooks as fields).
 */
import { Enum } from "@stackra/contracts";
import { useMemo } from "react";

import { Locale } from "#core/enums/locale.enum";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";
import type { LocaleState } from "./locale-state.type";

/** A locale's name in its own language. */
const endonym = (locale: Locale): string => Enum.meta(Locale, locale).endonym;

/**
 * The active locale and its facts.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const { locale, setLocale, endonym } = useLocale();
 * <span lang={locale}>{endonym(locale)}</span>
 */
export function useLocale(): LocaleState {
  const { locale, config, setLocale } = useI18nState();
  return useMemo<LocaleState>(
    () => ({
      locale,
      direction: config.rtl.includes(locale) ? "rtl" : "ltr",
      endonym,
      setLocale,
    }),
    [locale, config, setLocale],
  );
}
