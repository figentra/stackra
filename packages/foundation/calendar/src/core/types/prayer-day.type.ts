/**
 * Stackra file contract:
 * Purpose: `PrayerDay`, the five prayer times and sunrise of one local date at one place, as UTC instants.
 * Boundary: a type only. Instants are ISO 8601 UTC (`2026-01-01T02:39:00.000Z`), rounded to the minute; a caller
 *           shows them in the place's zone with `Intl`. Quiet hours read the windows around them.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2).
 */
import type { IsoDate } from "#core/types/iso-date.type";

/** One day's prayer times. */
export type PrayerDay = {
  /** The local date asked for. */
  readonly date: IsoDate;
  readonly fajr: string;
  readonly sunrise: string;
  readonly dhuhr: string;
  readonly asr: string;
  readonly maghrib: string;
  readonly isha: string;
};
