/**
 * Stackra file contract:
 * Purpose: `useNumberFormat()`, the web number writer: a value in the `DesignSystemProvider`'s locale and the i18n
 *          digits setting (Latin or Arabic-Indic), with any `Intl.NumberFormat` options.
 * Boundary: a hook over `formatNumber`; without a provider it writes in the browser's locale and its own digits.
 * Runtime: browser
 * Governing contract: ADR 0192 (digits setting); ADR 0403; STA-1371 (wave A, owner request 2026-10-29).
 */
import { formatNumber } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { use, useCallback } from "react";

import { DesignSystemContext } from "#react/design-system-provider/design-system-context";

/** Writes numbers in the provider's locale and digits. */
export function useNumberFormat(): (value: number, options?: Intl.NumberFormatOptions) => string {
  const locale =
    use(DesignSystemContext)?.locale ?? new Intl.NumberFormat().resolvedOptions().locale;
  const numerals = useNumerals();
  return useCallback(
    (value, options) => formatNumber(value, locale, options, numerals),
    [locale, numerals],
  );
}
