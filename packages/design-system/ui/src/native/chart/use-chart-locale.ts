/**
 * Stackra file contract:
 * Purpose: `useChartLocale`, what every native chart reads from the provider: the locale (with the customer's digits as its `-u-nu-` keyword), whether the layout runs
 *          right to left, and the spoken table's header words.
 * Boundary: a React hook over the native DesignSystemContext, `useDirection` and the shared `useUiText`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { NumberingSystem } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { use } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDirection } from "#native/bidi/use-direction";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

/** The chart words' keys. */
const K = UI_KEYS.ui.chart;

/** The locale, direction and table words of the nearest provider (the device's direction and English without one). */
export function useChartLocale(): {
  readonly locale: string;
  readonly isRtl: boolean;
  readonly words: { readonly category: string; readonly value: string };
} {
  const base = use(DesignSystemContext)?.locale ?? "en";
  const numerals = useNumerals();
  // The customer's digits travel as the tag's `-u-nu-` keyword, which the shared formatters read (ADR 0192).
  const locale =
    numerals === NumberingSystem.User || base.includes("-u-") ? base : `${base}-u-nu-${numerals}`;
  const isRtl = useDirection() === "rtl";
  const t = useUiText();
  return { locale, isRtl, words: { category: t(K.category), value: t(K.value) } };
}
