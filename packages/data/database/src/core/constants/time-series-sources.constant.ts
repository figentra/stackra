/**
 * Stackra file contract:
 * Purpose: `TIME_SERIES_SOURCES`, each registered `TimeSeries` class with its source model, written by
 *          `registerTimeSeries` and read by `rollUpTimeSeries` and `rollUpAllTimeSeries`.
 * Boundary: internal; a process-wide registry, like the model partners.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0305 (rule 5: the partner is the type argument).
 */
import type { AnyClass } from "@stackra/container";

import type { TimeSeriesClass } from "#core/types/time-series-class.type";

/** Each time series and its source model. */
export const TIME_SERIES_SOURCES = new Map<TimeSeriesClass, AnyClass>();
