/**
 * Stackra file contract:
 * Purpose: `MemoryForecasterDriver`, the `memory` driver of the `Forecaster` port: a naive forecast in process, so a
 *          scheduled forecast job runs end to end in a test or a local host with no service. Each requested model (AutoETS
 *          when none is named) forecasts the series' last value for every step, with an 80% band of the series' mean
 *          absolute step change times 1.2816 (a model with no interval, CrostonOptimized, gets a band equal to the mean).
 * Boundary: implements the port only and names no engine; it runs the same query check as the `http` driver, so a
 *           malformed query fails the same way. The numbers are a stand-in, never a real forecast.
 *           `testDefault`: this package's own tests and a host's tests take it when the port is not bound.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0266 (decision 2: a memory driver per capability).
 */
import { Driver } from "@stackra/container";

import { Forecaster } from "#contracts/ports/forecaster.port";
import type { ForecastQuery } from "#contracts/types/forecast-query.type";
import type { ForecastRow } from "#contracts/types/forecast-row.type";
import { checkForecastQuery } from "#node/functions/check-forecast-query.function";
import { forecastTimestamps } from "#node/functions/forecast-timestamps.function";

/** The z-score of an 80% two-sided interval. */
const Z80 = 1.2816;

/** `value` repeated `count` times. */
function repeat(value: number, count: number): number[] {
  return Array.from({ length: count }, () => value);
}

/**
 * Forecasts the last value forward.
 *
 * @example
 * const rows = await new MemoryForecasterDriver().forecast({ series, horizon: 7, frequency: "D" });
 */
export class MemoryForecasterDriver extends Driver(Forecaster, { testDefault: true }) {
  /**
   * Implements `Forecaster.forecast`, documented there.
   *
   * @throws ForecastQueryInvalidError for a malformed query.
   */
  async forecast(query: ForecastQuery): Promise<readonly ForecastRow[]> {
    checkForecastQuery(query);
    const models = query.models ?? (["AutoETS"] as const);
    return query.series.flatMap((series) => {
      const last = series.values.at(-1) ?? 0;
      const steps = series.values
        .slice(1)
        .map((value, index) => Math.abs(value - (series.values[index] ?? 0)));
      const width = (steps.reduce((total, step) => total + step, 0) / steps.length) * Z80;
      const timestamps = forecastTimestamps(
        series.timestamps.at(-1) ?? "",
        query.frequency,
        query.horizon,
      );
      return models.map((model): ForecastRow => {
        const band = model === "CrostonOptimized" ? 0 : width;
        return {
          id: series.id,
          model,
          timestamps,
          mean: repeat(last, query.horizon),
          lo80: repeat(last - band, query.horizon),
          hi80: repeat(last + band, query.horizon),
        };
      });
    });
  }
}
