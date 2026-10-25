/**
 * Stackra file contract:
 * Purpose: `HolidayKind`, the three shapes a holiday rule takes in market-pack and tenant data: one dated span, a
 *          yearly Gregorian date, or a yearly Umm al-Qura date.
 * Boundary: an `Enum.of` value plus the type of the same name; the `kind` discriminator of `HolidayRule`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 3: holiday sets are data); ADR 0294 (decision 16: Enum); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The shapes of a holiday rule. */
export const HolidayKind = Enum.of({
  /** One span from a given date: an announced holiday, a closure, a court recess or a confirmation. */
  Dated: "dated",
  /** Every year on a Gregorian month and day. */
  Gregorian: "gregorian",
  /** Every year on an Umm al-Qura month and day. */
  Hijri: "hijri",
});

/** One of the codes above. */
export type HolidayKind = Enum.Value<typeof HolidayKind>;
