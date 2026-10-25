/**
 * Stackra file contract:
 * Purpose: `DayStatus`, what one date is under a `BusinessCalendar`: a working day, a rest day of the working week, a
 *          confirmed holiday, or a day a moon-sighted holiday may fall on that nobody has confirmed yet.
 * Boundary: an `Enum.of` value plus the type of the same name. A holiday wins over a rest day; `uncertain` is only
 *           returned for a day that is otherwise a working day.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 4: "uncertain" instead of a silent guess); ADR 0294 (decision 16: Enum);
 *                     ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The status of one date. */
export const DayStatus = Enum.of({
  /** A day of the working week with no holiday on it. */
  Working: "working",
  /** A day the working week does not list. */
  RestDay: "rest_day",
  /** A confirmed holiday, closure or recess. */
  Holiday: "holiday",
  /** A working day a sighted Hijri holiday may fall on; not confirmed yet. */
  Uncertain: "uncertain",
});

/** One of the codes above. */
export type DayStatus = Enum.Value<typeof DayStatus>;
