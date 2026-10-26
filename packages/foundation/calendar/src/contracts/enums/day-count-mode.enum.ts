/**
 * Stackra file contract:
 * Purpose: `DayCountMode`, which days a period of days counts: every calendar day, or only the business days of a
 *          `BusinessCalendar` (`addBusinessDays`). A legal deadline rule, a payment term or a delivery promise names one.
 * Boundary: an `Enum.of` value plus the type of the same name. Not `CountMode`, which is what an RRULE COUNT counts.
 *           Trigger day, roll-forward and extensions are the caller's rules, never decided here.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 3 and 4); ADR 0294 (decision 16: Enum); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** What a count of days counts. */
export const DayCountMode = Enum.of({
  /** Every day on the calendar, closed days included. */
  Calendar: "calendar",
  /** Only the days the business calendar is open (working week less holidays). */
  Business: "business",
});

/** One of the codes above. */
export type DayCountMode = Enum.Value<typeof DayCountMode>;
