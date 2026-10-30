/**
 * Stackra file contract:
 * Purpose: `formatChartCategory`, a chart's category (an axis tick, a tooltip title, a table row header) as text: a
 *          date in the locale when a date format is given, a number in the locale, anything else as given.
 * Boundary: pure. Dates are read and written in UTC, so an ISO day (`2026-04-01`) never slips to the day before. The
 *           digits are the locale tag's `-u-nu-` keyword's (the customer's setting), through @stackra/i18n's shared
 *           formatters.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0192 (digits); ADR 0060 (Arabic); STA-1371.
 */
import { formatDateTime } from "@stackra/i18n";

import { formatChartNumber } from "#core/functions/format-chart-number.function";

/**
 * `value` as a category label in `locale`.
 * @param value - the row's category: a word, an ISO date, a timestamp or a number
 * @param locale - a BCP 47 tag
 * @param dateFormat - when given, the category is a date written with these options
 * @returns the label; empty for a missing category
 */
export function formatChartCategory(
  value: unknown,
  locale: string,
  dateFormat?: Intl.DateTimeFormatOptions,
): string {
  if (value === null || value === undefined) return "";
  if (dateFormat && (typeof value === "string" || typeof value === "number")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()))
      return formatDateTime(date, locale, { timeZone: "UTC", ...dateFormat });
  }
  return typeof value === "number" ? formatChartNumber(value, locale) : String(value);
}
