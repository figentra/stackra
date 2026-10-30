/**
 * Stackra file contract:
 * Purpose: `CalendarSystem`, the calendars a date is written in: Gregorian, or the Umm al-Qura Hijri calendar Saudi
 *          Arabia uses, as Intl names them.
 * Boundary: the values only; the formatting is Intl's.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** The calendar systems. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); add a calendar when a market needs it.
export const CalendarSystem = Object.freeze(["gregory", "islamic-umalqura"] as const);

/** One calendar system. */
export type CalendarSystem = (typeof CalendarSystem)[number];
