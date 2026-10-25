/**
 * Stackra file contract:
 * Purpose: `hijriAt`, the Umm al-Qura date of a day number, read from the runtime's ICU `islamic-umalqura` calendar.
 * Boundary: internal; `hijriOf` is its public form. Throws an `Error` when the runtime has no Umm al-Qura calendar
 *           (an engine built without full ICU) instead of returning a civil Hijri guess. ICU's table covers 1300 to
 *           1600 AH; outside it ICU computes the arithmetic calendar.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2); ADR 0192 (2026-10-24 amendment: `islamic-umalqura`).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import type { HijriDate } from "#core/types/hijri-date.type";

/** Umm al-Qura with Latin digits, read in UTC so a day number maps to one date. */
const UMM_AL_QURA = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/**
 * The Umm al-Qura date of day number `day`.
 *
 * @example
 * hijriAt(20_148); // { year: 1446, month: 9, day: 1 } (2025-03-01)
 */
export function hijriAt(day: number): HijriDate {
  if (UMM_AL_QURA.resolvedOptions().calendar !== "islamic-umalqura")
    throw new Error("This runtime has no Umm al-Qura calendar (Intl needs full ICU)");
  const parts = Object.fromEntries(
    UMM_AL_QURA.formatToParts(day * MS_PER_DAY).map((part) => [part.type, part.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}
