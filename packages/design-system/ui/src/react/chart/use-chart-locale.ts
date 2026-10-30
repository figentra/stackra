/**
 * Stackra file contract:
 * Purpose: `useChartLocale`, what every web chart reads from the provider: the locale, whether the page reads right to
 *          left, and the data table's header words.
 * Boundary: a React hook over React Aria's `useLocale` (which the DesignSystemProvider sets) and `useUiText`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { useLocale } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** The chart words' keys. */
const K = UI_KEYS.ui.chart;

/** The locale, direction and table words of the nearest provider. */
export function useChartLocale(): {
  readonly locale: string;
  readonly isRtl: boolean;
  readonly words: { readonly category: string; readonly value: string };
} {
  const { locale, direction } = useLocale();
  const t = useUiText();
  return {
    locale,
    isRtl: direction === "rtl",
    words: { category: t(K.category), value: t(K.value) },
  };
}
