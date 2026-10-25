/**
 * Stackra file contract:
 * Purpose: `HijriDate`, a date in the Umm al-Qura calendar: year, month (1 Muharram to 12 Dhu al-Hijjah) and day.
 * Boundary: a type only; `hijriOf` and `gregorianOf` convert it to and from an `IsoDate`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2); ADR 0192 (2026-10-24 amendment: `islamic-umalqura`).
 */

/** An Umm al-Qura date. */
export interface HijriDate {
  /** The year after the Hijra (`1447`). */
  readonly year: number;

  /** The month, 1 to 12. */
  readonly month: number;

  /** The day of the month, 1 to 30. */
  readonly day: number;
}
