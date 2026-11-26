/**
 * Stackra file contract:
 * Purpose: `CalendarSystem`, the calendars a date is written in: Gregorian, or the Umm al-Qura Hijri calendar Saudi
 *          Arabia uses. The codes are Intl's calendar names, so they go to `Intl.DateTimeFormat`'s `calendar` and a
 *          `-u-ca-` keyword as they are.
 * Boundary: the values only; the formatting is Intl's. A tenant picks one in `DisplaySettings` (`@stackra/settings`).
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 3: Gregorian by default); ADR 0128 (enums); ADR 0294 (as amended by
 *                     programming model v3.1).
 */
import { Enum } from "@stackra/contracts";

/** The calendar systems; add one when a market needs it. */
export const CalendarSystem = Enum.of({
  /** The Gregorian calendar; the default (ADR 0192). */
  Gregory: "gregory",
  /** The Umm al-Qura Hijri calendar (Saudi Arabia's official calendar). */
  IslamicUmalqura: "islamic-umalqura",
});

/** One of the codes above. */
export type CalendarSystem = Enum.Value<typeof CalendarSystem>;
