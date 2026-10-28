/**
 * Stackra file contract:
 * Purpose: `registerTimeSeries(pairs)`, what gen's entry tells the runtime about each `TimeSeries` declaration: its
 *          source model, the type argument that is gone at runtime.
 * Boundary: writes the internal `TIME_SERIES_SOURCES` registry; a later pair for the same class replaces the earlier.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0305 (rule 5: the partner is the type argument).
 */
import type { AnyClass } from "@stackra/container";

import { TIME_SERIES_SOURCES } from "#core/constants/time-series-sources.constant";
import type { TimeSeriesClass } from "#core/types/time-series-class.type";

/**
 * Registers time series with their source models.
 *
 * @example
 * registerTimeSeries([[MeterReadingSeries, MeterReading]]);
 */
export function registerTimeSeries(
  pairs: readonly (readonly [series: TimeSeriesClass, model: AnyClass])[],
): void {
  for (const [series, model] of pairs) TIME_SERIES_SOURCES.set(series, model);
}
