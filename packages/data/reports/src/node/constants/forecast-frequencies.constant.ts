/**
 * Stackra file contract:
 * Purpose: `FORECAST_FREQUENCIES`, the steps a forecast query may name: `H`, `D`, `W`, `M`.
 * Boundary: internal data; `checkForecastQuery` reads it. The list equals the image's.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8).
 */
import type { ForecastFrequency } from "#contracts/types/forecast-frequency.type";

/** The steps a forecast runs in. */
export const FORECAST_FREQUENCIES: readonly ForecastFrequency[] = Object.freeze([
  "H",
  "D",
  "W",
  "M",
]);
