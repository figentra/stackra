/**
 * Stackra file contract:
 * Purpose: `PRAYER_METHOD_SCHEMA`, the zod schema of `PrayerMethod` (its `X$`): the value of the pack key
 *          `calendar.prayer_times`: the Fajr angle, Isha as an angle or as minutes after Maghrib, the Asr shadow
 *          factor, minutes added to sunset for Maghrib, and the high-latitude rule.
 * Boundary: shape only, no values: which angles a market uses (Umm al-Qura, the Egyptian General Authority, ISNA,
 *           a mosque's own) is pack data. Isha is exactly one of `ishaAngle` and `ishaMinutes`. `maghribMinutes`
 *           defaults to 0, nothing else does.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2); ADR 0366 (calendar values come from pack keys under `calendar.`).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { HighLatitudeRule } from "#core/enums/high-latitude-rule.enum";

/** A depression angle of the sun in degrees. */
const ANGLE = z.number().gt(0).max(30);

/** The shipped `PrayerMethod$`. */
export const PRAYER_METHOD_SCHEMA = z
  .object({
    fajrAngle: ANGLE,
    ishaAngle: ANGLE.exactOptional(),
    ishaMinutes: z.int().min(1).max(240).exactOptional(),
    asrFactor: z.union([z.literal(1), z.literal(2)]),
    maghribMinutes: z.int().min(0).max(60).default(0),
    highLatitude: z.enum(Enum.values(HighLatitudeRule)),
  })
  .refine((method) => (method.ishaAngle === undefined) !== (method.ishaMinutes === undefined), {
    message: "Isha is an angle or minutes after Maghrib, not both",
    path: ["ishaAngle"],
  });
