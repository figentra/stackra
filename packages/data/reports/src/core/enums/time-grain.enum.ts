/**
 * Stackra file contract:
 * Purpose: `TimeGrain`, the buckets a time dimension of a report may be grouped by: hour, day, week, month, quarter and
 *          year, bucketed in the scope's time zone.
 * Boundary: an `Enum.of` value plus the type of the same name; the closed set of ADR 0470 decision 2. The bucketing is
 *           the report compiler's (stackra-390), never the browser's.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: dimensions); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** How a time dimension is bucketed. */
export const TimeGrain = Enum.of({
  /** One bucket per hour. */
  Hour: "hour",
  /** One bucket per calendar day. */
  Day: "day",
  /** One bucket per ISO week. */
  Week: "week",
  /** One bucket per calendar month. */
  Month: "month",
  /** One bucket per calendar quarter. */
  Quarter: "quarter",
  /** One bucket per calendar year. */
  Year: "year",
});

/** One of the grains above. */
export type TimeGrain = Enum.Value<typeof TimeGrain>;
