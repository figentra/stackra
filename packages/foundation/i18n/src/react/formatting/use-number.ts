/**
 * Stackra file contract:
 * Purpose: `useNumber()`, the hook a component shows a plain number with: `number = useNumber()`, then
 *          `this.number(data.balance)` or `this.number(ratio, { style: "percent" })`.
 * Boundary: `formatNumber` in the active locale and the configured digits (on every engine); the options are Intl's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2: digits), ADR 0305 (class components: hooks as fields).
 */
import { useMemo } from "react";

import { formatNumber } from "#core/functions/format-number.function";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";

/**
 * The number formatter of the active locale.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const number = useNumber();
 * number(12_500); // "12,500" in en
 */
export function useNumber(): (
  value: number | bigint,
  options?: Intl.NumberFormatOptions,
) => string {
  const { intlLocale, numerals } = useI18nState();
  return useMemo(
    () => (value: number | bigint, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, intlLocale, options, numerals),
    [intlLocale, numerals],
  );
}
