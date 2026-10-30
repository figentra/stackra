/**
 * Stackra file contract:
 * Purpose: `formatChartNumber`, a chart value as the locale writes it, in the digits the customer chose (the locale
 *          tag's `-u-nu-` keyword, which the DesignSystemProvider adds from the i18n provider's setting; Latin by
 *          default, ADR 0192).
 * Boundary: pure, over @stackra/i18n's shared `formatNumber`, which writes the digits where the engine ignores the
 *           keyword (Hermes on iOS); a tag without one keeps the engine's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0192 (digits); ADR 0060 (Arabic); STA-1371.
 */
import { formatNumber } from "@stackra/i18n";

/**
 * `value` written in `locale`.
 * @example formatChartNumber(1234.5, "ar-u-nu-arab", { style: "currency", currency: "USD" }); // "١٬٢٣٤٫٥٠ US$"
 */
export function formatChartNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return formatNumber(value, locale, options);
}
