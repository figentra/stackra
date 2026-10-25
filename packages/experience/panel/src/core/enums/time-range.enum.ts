/**
 * Stackra file contract:
 * Purpose: `TimeRange`, the named periods a dashboard's or a widget's range picker offers.
 * Boundary: an enum (`Enum.of`) carried by `TimeRangeInput.range`; the query turns it into a window with
 *           `ctx.period(input)`. `Custom` reads the input's `from` and `to`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 20: ranges); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A named reporting period.
 *
 * @example
 * ranges: [TimeRange.Today, TimeRange.Last7Days, TimeRange.ThisMonth]
 */
export const TimeRange = Enum.of({
  /** From local midnight to the next. */
  Today: "today",
  /** The local day before today. */
  Yesterday: "yesterday",
  /** Today and the six days before it. */
  Last7Days: "last_7_days",
  /** Today and the 29 days before it. */
  Last30Days: "last_30_days",
  /** The local calendar month. */
  ThisMonth: "this_month",
  /** The input's own `from` and `to`. */
  Custom: "custom",
});

/** One of the codes above. */
export type TimeRange = Enum.Value<typeof TimeRange>;
