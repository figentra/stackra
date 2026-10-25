/**
 * Stackra file contract:
 * Purpose: `LeapBirthday`, the day a person born on 29 February turns a year older in a common year. The law of the
 *          market decides it, so the caller passes the market pack's value to `ageOn`.
 * Boundary: an `Enum.of` value plus the type of the same name. No default: the package never picks a jurisdiction.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 8: age on a date); ADR 0363 (decision 4: legal rules are pack data).
 */
import { Enum } from "@stackra/contracts";

/** When a 29 February birthday falls in a common year. */
export const LeapBirthday = Enum.of({
  /** On 28 February. */
  February28: "february_28",
  /** On 1 March. */
  March1: "march_1",
});

/** One of the codes above. */
export type LeapBirthday = Enum.Value<typeof LeapBirthday>;
