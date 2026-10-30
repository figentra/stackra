/**
 * Stackra file contract:
 * Purpose: `wheelDateColumnsOf(input)`, the day, month and year wheels of a WheelDatePicker in the order the locale
 *          writes a date, with the month names and the digits of the locale, and the value as the wheels' keys.
 * Boundary: pure; Intl only. The day wheel holds the days of the shown month and year.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { CalendarDate } from "@internationalized/date";
import { type NumberingSystem, numeralsOf, withDigits } from "@stackra/i18n";

import type { WheelPickerColumn } from "#contracts/types/wheel-picker-column.type";
import type { WheelDateColumns } from "#core/types/wheel-date-columns.type";
import { yearsBetween } from "#core/functions/years-between.function";

/**
 * The wheels of a day.
 * @param input - the day, the bounds of the year wheel, the locale, the column names and the digits
 * @returns the wheels in the locale's order and the value as keys
 */
export function wheelDateColumnsOf(input: {
  readonly value: CalendarDate;
  readonly minYear: number;
  readonly maxYear: number;
  readonly locale: string;
  readonly labels: { readonly day: string; readonly month: string; readonly year: string };
  readonly numerals?: NumberingSystem | undefined;
}): WheelDateColumns {
  const { value, locale, labels } = input;
  const numerals = input.numerals ?? numeralsOf(locale);
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  const text = (n: number) => withDigits(number.format(n), numerals);
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const days = value.calendar.getDaysInMonth(value);
  const columns: Record<string, WheelPickerColumn> = {
    day: {
      id: "day",
      label: labels.day,
      items: Array.from({ length: days }, (_, i) => ({ id: String(i + 1), label: text(i + 1) })),
    },
    month: {
      id: "month",
      label: labels.month,
      items: Array.from({ length: 12 }, (_, i) => ({
        id: String(i + 1),
        label: withDigits(monthName.format(Date.UTC(2000, i, 15)), numerals),
      })),
    },
    year: {
      id: "year",
      label: labels.year,
      items: yearsBetween(input.minYear, input.maxYear).map((year) => ({
        id: String(year),
        label: text(year),
      })),
    },
  };
  const order = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
    .formatToParts(Date.UTC(2000, 0, 15))
    .map((part) => part.type)
    .filter((type): type is "day" | "month" | "year" => type in columns);
  return {
    columns: order.map((type) => columns[type] as WheelPickerColumn),
    value: { day: String(value.day), month: String(value.month), year: String(value.year) },
  };
}
