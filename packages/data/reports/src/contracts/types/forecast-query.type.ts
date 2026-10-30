/**
 * Stackra file contract:
 * Purpose: `ForecastQuery`, what a forecast is asked: the series, how many steps ahead, the step, and optionally the
 *          models to run.
 * Boundary: a type only. Without `models`, each series gets AutoETS and AutoARIMA, or CrostonOptimized when it is
 *           intermittent (at least half of its values are zero).
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0294 (decision 15: the leaf entry).
 */
import type { ForecastFrequency } from "#contracts/types/forecast-frequency.type";
import type { ForecastModel } from "#contracts/types/forecast-model.type";
import type { ForecastSeries } from "#contracts/types/forecast-series.type";

/** A batch of series to forecast. */
export interface ForecastQuery {
  /** One to 5000 series with distinct ids, each of at least three points. */
  readonly series: readonly ForecastSeries[];

  /** Steps ahead, 1 to 366. */
  readonly horizon: number;

  /** The step between points. */
  readonly frequency: ForecastFrequency;

  /** The models to run on every series; the defaults above when left out. */
  readonly models?: readonly ForecastModel[];
}
