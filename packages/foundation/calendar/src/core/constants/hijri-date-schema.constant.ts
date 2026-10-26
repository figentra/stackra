/**
 * Stackra file contract:
 * Purpose: `HIJRI_DATE_SCHEMA`, the shipped `HijriDate$`: an Umm al-Qura year, a month 1 to 12 and a day 1 to 30.
 * Boundary: shape only; a Hijri date is a view computed from the stored `IsoDate` (`hijriOf`), so this checks ranges
 *           and never whether the month really has a 30th day.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0366 (decision 2); STA-1284.
 */
import { z } from "zod";

import type { HijriDate } from "#core/types/hijri-date.type";

/** The shipped `HijriDate$`. */
export const HIJRI_DATE_SCHEMA: z.ZodType<HijriDate> = z.object({
  year: z.int().min(1),
  month: z.int().min(1).max(12),
  day: z.int().min(1).max(30),
});
