/**
 * Stackra file contract:
 * Purpose: `CountMode`, what COUNT counts in `occurrences`: every date the rule generates, as RFC 5545 does with
 *          EXDATE (the default), or only the dates kept after excepted dates and holidays are left out, so "ten
 *          sessions" stays ten when a holiday falls on one.
 * Boundary: an `Enum.of` value plus the type of the same name; a `RecurrenceOptions` field. Which one a product uses
 *           is its own setting, never decided here.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (COUNT mode; owner question 5 of STA-708); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/** What COUNT counts. */
export const CountMode = Enum.of({
  /** Every generated date, excepted and holiday dates included (RFC 5545). */
  Generated: "generated",
  /** Only the dates that are returned or would be but for the window. */
  Kept: "kept",
});

/** One of the codes above. */
export type CountMode = Enum.Value<typeof CountMode>;
