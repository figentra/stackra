/**
 * Stackra file contract:
 * Purpose: `checkForecastQuery`, the shape check every `Forecaster` driver runs first: a horizon of 1 to 366 steps, a
 *          known frequency, known models, one to 5000 series with distinct non-empty ids, equal-length timestamps and
 *          values, at least three points each, and finite values.
 * Boundary: pure; throws `ForecastQueryInvalidError` naming the first problem and never echoing a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8).
 */
import type { ForecastQuery } from "#contracts/types/forecast-query.type";
import { FORECAST_FREQUENCIES } from "#node/constants/forecast-frequencies.constant";
import { FORECAST_LIMITS } from "#node/constants/forecast-limits.constant";
import { FORECAST_MODELS } from "#node/constants/forecast-models.constant";
import { ForecastQueryInvalidError } from "#node/errors/forecast-query-invalid.error";

/** Throws the refusal for `reason`. */
function invalid(reason: string): never {
  throw ForecastQueryInvalidError.create({ reason });
}

/**
 * Checks that a forecast query is well formed before a driver acts on it: the horizon, frequency, models, series
 * count, ids, lengths, point counts and values.
 *
 * @throws ForecastQueryInvalidError for the first problem found.
 * @example
 * checkForecastQuery({ series, horizon: 28, frequency: "D" });
 */
export function checkForecastQuery(query: ForecastQuery): void {
  const { maxHorizon, maxSeries, minPoints } = FORECAST_LIMITS;
  if (!Number.isInteger(query.horizon) || query.horizon < 1 || query.horizon > maxHorizon)
    invalid(`the horizon is a whole number of steps from 1 to ${maxHorizon}`);
  if (!FORECAST_FREQUENCIES.includes(query.frequency))
    invalid(`the frequency is one of ${FORECAST_FREQUENCIES.join(", ")}`);
  if (
    query.models !== undefined &&
    (query.models.length === 0 || query.models.some((model) => !FORECAST_MODELS.includes(model)))
  )
    invalid(`models is a non-empty list of ${FORECAST_MODELS.join(", ")}`);
  if (query.series.length < 1 || query.series.length > maxSeries)
    invalid(`a forecast takes 1 to ${maxSeries} series`);
  const seen = new Set<string>();
  for (const [index, series] of query.series.entries()) {
    const where = `series[${index}]`;
    if (series.id === "" || seen.has(series.id)) invalid(`${where} needs a distinct non-empty id`);
    seen.add(series.id);
    if (series.timestamps.length !== series.values.length)
      invalid(`${where} needs as many timestamps as values`);
    if (series.values.length < minPoints) invalid(`${where} needs at least ${minPoints} points`);
    if (!series.values.every((value) => Number.isFinite(value)))
      invalid(`${where} values must be finite numbers`);
  }
}
