/**
 * Stackra file contract:
 * Purpose: `FORECAST_LIMITS`, the bounds of one forecast query: at most 5000 series, a horizon of at most 366 steps and
 *          at least three points per series, the same the `tools-forecast` image enforces
 *          (`images/forecast/server.py` in `@stackra/infra-tools`).
 * Boundary: internal data; `checkForecastQuery` reads it so a bad query fails before a request is sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8).
 */

/** The bounds of one query. */
export const FORECAST_LIMITS = Object.freeze({
  maxSeries: 5000,
  maxHorizon: 366,
  minPoints: 3,
});
