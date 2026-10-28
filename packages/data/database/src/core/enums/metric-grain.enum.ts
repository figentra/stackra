/**
 * Stackra file contract:
 * Purpose: `MetricGrain`, the bucket a metrics series counts by: `paid.series(Aggregate.Count, undefined,
 *          MetricGrain.Hour)`.
 * Boundary: an `Enum.of` value plus the type of the same name. Each bucket is a calendar unit in the metric's time
 *           zone (Postgres `date_trunc`; a week starts on Monday), so a day that crosses a daylight-saving change is
 *           still one local day. The codes match `@stackra/reports`' `TimeGrain`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 16); ADR 0136 (decision 1: the time zone); ADR 0294 (decision 16); reporting
 *                     gap 10.
 */
import { Enum } from "@stackra/contracts";

/** The bucket of a metrics series. */
export const MetricGrain = Enum.of({
  /** One clock hour. */
  Hour: "hour",
  /** One local day; the default. */
  Day: "day",
  /** One week, Monday first. */
  Week: "week",
  /** One calendar month. */
  Month: "month",
  /** One calendar quarter. */
  Quarter: "quarter",
});

/** One of the codes above. */
export type MetricGrain = Enum.Value<typeof MetricGrain>;
