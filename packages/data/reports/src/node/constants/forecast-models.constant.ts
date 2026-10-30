/**
 * Stackra file contract:
 * Purpose: `FORECAST_MODELS`, the models a forecast query may name: `AutoETS`, `AutoARIMA`, `CrostonOptimized`.
 * Boundary: internal data; `checkForecastQuery` reads it. The list equals the image's.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8).
 */
import type { ForecastModel } from "#contracts/types/forecast-model.type";

/** The models a forecast may name. */
export const FORECAST_MODELS: readonly ForecastModel[] = Object.freeze([
  "AutoETS",
  "AutoARIMA",
  "CrostonOptimized",
]);
