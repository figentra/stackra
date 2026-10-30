/**
 * Stackra file contract:
 * Purpose: `recurrenceWeekdaysFor(locale)`, the seven RFC 5545 weekdays in the order the locale's week runs: Sunday
 *          first for Saudi Arabia and the United States, Saturday first where the week starts then, Monday elsewhere.
 * Boundary: pure; reads `Intl.Locale`'s week info, and starts on Monday where the runtime has none.
 * Runtime: isomorphic
 * Governing contract: ADR 0060; ADR 0403; STA-1371.
 */
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";
import { RECURRENCE_WEEKDAYS } from "#core/constants/recurrence-weekdays.constant";

/** Intl's week info, typed where the runtime's lib lacks it. */
type WeekInfoLocale = Intl.Locale & {
  readonly getWeekInfo?: () => { readonly firstDay: number };
  readonly weekInfo?: { readonly firstDay: number };
};

/**
 * The weekdays from the locale's first day.
 * @param locale - a BCP 47 tag
 * @returns the seven weekdays
 */
export function recurrenceWeekdaysFor(locale: string): readonly RecurrenceWeekday[] {
  // Hermes has no Intl.Locale; there the week starts on Monday, as where the runtime reports no week info.
  const info =
    typeof Intl.Locale === "function" ? (new Intl.Locale(locale) as WeekInfoLocale) : undefined;
  // firstDay counts 1 (Monday) to 7 (Sunday).
  const firstDay = info?.getWeekInfo?.().firstDay ?? info?.weekInfo?.firstDay ?? 1;
  const start = (firstDay - 1) % 7;
  return [...RECURRENCE_WEEKDAYS.slice(start), ...RECURRENCE_WEEKDAYS.slice(0, start)];
}
