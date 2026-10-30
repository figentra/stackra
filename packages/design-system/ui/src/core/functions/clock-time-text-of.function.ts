/**
 * Stackra file contract:
 * Purpose: `clockTimeTextOf(value, locale, hourCycle, numerals)`, a time of day as the locale writes it ("3:45 PM",
 *          "15:45", "٣:٤٥ م") in the customer's digits: the value a TimeClock's face speaks.
 * Boundary: pure; Intl only, in UTC so no zone shifts the hour.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (digits); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { type NumberingSystem, numeralsOf, withDigits } from "@stackra/i18n";

import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";

/**
 * The written time.
 * @example clockTimeTextOf({ hour: 15, minute: 45 }, "en-US", 12); // "3:45 PM"
 */
export function clockTimeTextOf(
  value: TimeValue,
  locale: string,
  hourCycle: HourCycle,
  numerals?: NumberingSystem,
): string {
  const text = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: hourCycle === 12 ? "h12" : "h23",
    timeZone: "UTC",
  }).format(Date.UTC(2000, 0, 1, value.hour, value.minute));
  return withDigits(text, numerals ?? numeralsOf(locale));
}
