/**
 * Stackra file contract:
 * Purpose: `TimeSeriesOptions<S>`, the options of `TimeSeries<S>({ ... })`: the series key, the source's time field,
 *          the dimensions each rollup groups by, the measures, the rollup grains, how late a row may arrive and how
 *          long each rollup keeps its buckets.
 * Boundary: a type only; `TimeSeries` checks the values when the class is declared.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321).
 */
import type { Duration } from "@stackra/contracts";

import type { MetricGrain } from "#core/enums/metric-grain.enum";
import type { TimeSeriesMeasure } from "#core/types/time-series-measure.type";

/**
 * A time series declaration's options.
 *
 * @example
 * const options: TimeSeriesOptions<MeterReading> = {
 *   key: "meter_readings",
 *   time: "at",
 *   dimensions: ["scopeId", "meterId"],
 *   measures: { kwh: { aggregate: Aggregate.Sum, field: "kwh" } },
 *   rollups: [MetricGrain.Hour, MetricGrain.Day],
 * };
 */
export interface TimeSeriesOptions<S extends object = object> {
  /** The series key, snake_case; each rollup table is `ts_<key>_<grain>`. */
  readonly key: string;

  /** The source's time field, whose UTC bucket each row falls in. */
  readonly time: keyof S & string;

  /** The source fields each rollup groups by. The source's row-level security field is one of them. */
  readonly dimensions: readonly (keyof S & string)[];

  /** The rollup values, by camelCase name; each is a column of the same name in snake_case. */
  readonly measures: Readonly<Record<string, TimeSeriesMeasure<S>>>;

  /** The grains kept, each its own rollup table. */
  readonly rollups: readonly MetricGrain[];

  /** How late a row may arrive and still be counted: each run recomputes the buckets since; one grain by default. */
  readonly lateness?: Duration;

  /** How long each grain keeps its buckets; a grain left out keeps them for good. */
  readonly retain?: Readonly<Partial<Record<MetricGrain, Duration>>>;
}
