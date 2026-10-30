/**
 * Stackra file contract:
 * Purpose: `useTranslation()`, the hook a component translates with: `translation = useTranslation()` as a class
 *          component field, then `t(I18n.web.nav.home)` or `t(I18n.web.locale_suggestion.body, { language })`.
 * Boundary: formats through `formatMessage` with the provider's catalogues, digit-aware locale tag and digits; the returned
 *           object is stable while the locale and catalogues are.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: ICU, typed keys), ADR 0080, ADR 0305 (class components: hooks as fields).
 */
import { useMemo } from "react";

import { formatMessage } from "#core/functions/format-message.function";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";
import type { Translation } from "./translation.type";

/**
 * The translator of the active locale.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const { t } = useTranslation();
 * t(I18n.pages.home.title);
 */
export function useTranslation(): Translation {
  const { messages, intlLocale, numerals } = useI18nState();
  return useMemo<Translation>(
    () => ({ t: (key, values) => formatMessage(messages, key, values, intlLocale, numerals) }),
    [messages, intlLocale, numerals],
  );
}
