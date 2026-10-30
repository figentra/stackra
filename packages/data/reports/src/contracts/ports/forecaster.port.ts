/**
 * Stackra file contract:
 * Purpose: the `Forecaster` port: forecasts of time series (demand per item and location) with an 80% band, computed
 *          by a forecasting engine. Which engine is configuration (`ReportsConfig.forecaster`), never code.
 * Boundary: an abstract class that is its own token, keyed `reports.Forecaster`. It speaks only the types of this leaf
 *           entry. The `http` driver reaches the region's `tools-forecast` image (StatsForecast) and the `memory`
 *           driver answers in process for tests and local hosts (`@stackra/reports/node`). Forecasts run as scheduled
 *           jobs in the owning service, which calls in batches and stores the results as records; this port stores
 *           nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0142 (drivers behind a port); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { ForecastQuery } from "#contracts/types/forecast-query.type";
import type { ForecastRow } from "#contracts/types/forecast-row.type";

/**
 * Forecasts batches of series.
 *
 * @example
 * const rows = await forecaster.forecast({ series, horizon: 28, frequency: "D" });
 */
export abstract class Forecaster extends Port {
  /** Type-only port key, so `DriverName<Forecaster>` narrows to this port's drivers. */
  declare readonly "~key": "reports.Forecaster";

  /**
   * One row per series and model, in request order.
   *
   * @throws a validation refusal for a malformed query.
   */
  abstract forecast(query: ForecastQuery): Promise<readonly ForecastRow[]>;
}
