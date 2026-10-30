/**
 * Stackra file contract:
 * Purpose: `useDateTime()`, the hook a component shows a date or time with: `dateTime = useDateTime()`, then
 *          `this.dateTime(order.createdAt, { dateStyle: "medium", timeStyle: "short" })`.
 * Boundary: `formatDateTime` in the active locale and the configured digits (on every engine), in the provider's zone
 *           (a native app's region, else the runtime's) unless the options name one; the options are Intl's own. An ISO
 *           string or epoch milliseconds is read as a `Date`; an
 *           invalid date throws instead of printing "Invalid Date".
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decisions 2 and 3: digits, Gregorian by default), ADR 0305 (class components).
 */
import { useMemo } from "react";

import { formatDateTime } from "#core/functions/format-date-time.function";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";

/**
 * The date and time formatter of the active locale.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const dateTime = useDateTime();
 * dateTime(new Date("2026-10-24T09:30:00Z"), { dateStyle: "medium", timeZone: "UTC" }); // "Oct 24, 2026" in en
 */
export function useDateTime(): (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
) => string {
  const { intlLocale, numerals, timeZone } = useI18nState();
  return useMemo(
    () => (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(
        value,
        intlLocale,
        timeZone === null ? options : { timeZone, ...options },
        numerals,
      ),
    [intlLocale, numerals, timeZone],
  );
}
