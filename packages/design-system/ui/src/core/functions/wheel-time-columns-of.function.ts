/**
 * Stackra file contract:
 * Purpose: `wheelTimeColumnsOf(input)`, the hour, minute and (12-hour) period wheels of a WheelTimePicker in the
 *          locale's digits and period names.
 * Boundary: pure; Intl only. A time between two minute steps shows on the step below it.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import { type NumberingSystem, numeralsOf, withDigits } from "@stackra/i18n";

import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";
import type { WheelPickerColumn } from "#contracts/types/wheel-picker-column.type";
import type { WheelTimeColumns } from "#core/types/wheel-time-columns.type";

/**
 * The wheels of a time.
 * @param input - the time, the minute step, the hour cycle, the locale, the column names and the digits
 * @returns the wheels and the value as keys
 */
export function wheelTimeColumnsOf(input: {
  readonly value: TimeValue;
  readonly minuteStep: number;
  readonly hourCycle: HourCycle;
  readonly locale: string;
  readonly labels: { readonly hour: string; readonly minute: string; readonly period: string };
  readonly numerals?: NumberingSystem | undefined;
}): WheelTimeColumns {
  const { value, hourCycle, locale, labels } = input;
  const step = Math.max(1, Math.floor(input.minuteStep));
  const numerals = input.numerals ?? numeralsOf(locale);
  const two = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const text = (n: number) => withDigits(two.format(n), numerals);
  const is12 = hourCycle === 12;
  const hours = is12
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);
  const columns: WheelPickerColumn[] = [
    {
      id: "hour",
      label: labels.hour,
      items: hours.map((h) => ({ id: String(h), label: text(h) })),
    },
    {
      id: "minute",
      label: labels.minute,
      items: Array.from({ length: Math.ceil(60 / step) }, (_, i) => ({
        id: String(i * step),
        label: text(i * step),
      })),
    },
  ];
  const minute = String(Math.floor(value.minute / step) * step);
  if (!is12) return { columns, value: { hour: String(value.hour), minute } };
  const period = (hour: number) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true, timeZone: "UTC" })
      .formatToParts(Date.UTC(2000, 0, 1, hour))
      .find((part) => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
  columns.push({
    id: "period",
    label: labels.period,
    items: [
      { id: "am", label: period(9) },
      { id: "pm", label: period(15) },
    ],
  });
  return {
    columns,
    value: {
      hour: String(value.hour % 12 === 0 ? 12 : value.hour % 12),
      minute,
      period: value.hour < 12 ? "am" : "pm",
    },
  };
}
