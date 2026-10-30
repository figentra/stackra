/**
 * Stackra file contract:
 * Purpose: `spokenDurationOf(parts, format, locale)`, a duration in words to the minute ("2 hours, 14 minutes"),
 *          in the locale's unit words and list style, for a polite announcement.
 * Boundary: pure over the formatter it is given; seconds are said only under a minute, so announcements stay short.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave A).
 */
import type { ClockParts } from "#core/types/clock-parts.type";

/** The duration in words. */
export function spokenDurationOf(
  parts: ClockParts,
  format: (value: number, options?: Intl.NumberFormatOptions) => string,
  locale: string,
): string {
  const words = (
    [
      ["day", parts.days],
      ["hour", parts.hours],
      ["minute", parts.minutes],
    ] as const
  )
    .filter(([, value]) => value > 0)
    .map(([unit, value]) => format(value, { style: "unit", unit, unitDisplay: "long" }));
  if (words.length === 0) words.push(format(parts.seconds, { style: "unit", unit: "second", unitDisplay: "long" }));
  return new Intl.ListFormat(locale, { style: "long", type: "unit" }).format(words);
}
