/**
 * Stackra file contract:
 * Purpose: `ForecastModel`, a model a forecast may name: `AutoETS`, `AutoARIMA` or `CrostonOptimized` (for intermittent
 *          demand).
 * Boundary: a type only; the model names the forecast image accepts.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0294 (decision 15: the leaf entry).
 */

/** One of the models the forecast image runs. */
export type ForecastModel = "AutoETS" | "AutoARIMA" | "CrostonOptimized";
