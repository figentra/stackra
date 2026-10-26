/**
 * Stackra file contract:
 * Purpose: `HijriSchedule`, opening hours that apply on an Umm al-Qura date range each year (Ramadan hours, the Eid
 *          days), in place of the working week on those days.
 * Boundary: a type only, settings or pack data. The range is inclusive and may run into the next month; `hours` has
 *           the `BusinessCalendar` working-week shape (ISO weekday 1 to 7, `HH:mm` spans, a span ending at or before
 *           its start ends the next day). A weekday missing from `hours` is closed in the range.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 2 and 3); ADR 0192 (2026-10-24 amendment: `islamic-umalqura`).
 */

/** Hours for a yearly Hijri date range. */
export interface HijriSchedule {
  /** A stable key for the schedule (`ramadan`). */
  readonly key: string;

  /** The first day: Hijri month 1 to 12 and day 1 to 30. */
  readonly from: { readonly month: number; readonly day: number };

  /** The last day, inclusive. */
  readonly until: { readonly month: number; readonly day: number };

  /** The hours per weekday in the range. */
  readonly hours: readonly {
    readonly day: number;
    readonly hours: readonly { readonly start: string; readonly end: string }[];
  }[];
}
