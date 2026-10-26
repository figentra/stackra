/**
 * Stackra file contract:
 * Purpose: `HighLatitudeRule`, how Fajr and Isha are placed where the sun never sinks to their angle (summer north of
 *          about 48.5°): not at all (the day is refused), at a share of the night proportional to the angle, at the
 *          middle of the night, or at one seventh of the night from sunset and before sunrise.
 * Boundary: an `Enum.of` value plus the type of the same name. Which rule a market follows is pack data
 *           (`calendar.prayer_times.highLatitude`).
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2: prayer times; the method is pack data); ADR 0294 (decision 16: Enum);
 *                     ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The high-latitude adjustment of Fajr and Isha. */
export const HighLatitudeRule = Enum.of({
  /** No adjustment: a day without the angle has no Fajr or Isha and is refused. */
  None: "none",
  /** The angle over 60 of the night (18° gives three tenths). */
  AngleBased: "angle_based",
  /** Half the night. */
  MiddleOfNight: "middle_of_night",
  /** One seventh of the night. */
  OneSeventh: "one_seventh",
});

/** One of the codes above. */
export type HighLatitudeRule = Enum.Value<typeof HighLatitudeRule>;
