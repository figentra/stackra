/**
 * Stackra file contract:
 * Purpose: `CalendarSystem`, the calendars a date is written in: Gregorian, or the Umm al-Qura Hijri calendar Saudi
 *          Arabia uses, as Intl names them. The list of `@stackra/i18n`'s `CalendarSystem`, the one source the date
 *          formatting and a tenant's `DisplaySettings.calendar` read, so a picker never offers a calendar they lack.
 * Boundary: the values only; the formatting is Intl's. Kept as this entry's frozen list (a picker iterates it), not
 *           i18n's enum object.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305;
 *                     ADR 0192 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { CalendarSystem as Calendars } from "@stackra/i18n";

/** The calendar systems, in i18n's order. */
export const CalendarSystem = Object.freeze([...Enum.values(Calendars)]);

/** One calendar system. */
export type CalendarSystem = Calendars;
