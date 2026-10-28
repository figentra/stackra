/**
 * Stackra file contract:
 * Purpose: `TimeSeriesClass<S>`, a class declared with `TimeSeries<S>({ ... })`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0305 (rule 5: the partner is the type argument).
 */
import type { TimeSeriesBase } from "#core/bases/time-series-base.base";

/** A time series class. */
export type TimeSeriesClass<S extends object = object> = abstract new () => TimeSeriesBase<S>;
