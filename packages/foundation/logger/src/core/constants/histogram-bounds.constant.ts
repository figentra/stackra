/**
 * Stackra file contract:
 * Purpose: `HISTOGRAM_BOUNDS`, the explicit bucket bounds of every histogram the OTLP metrics driver records: the
 *          OpenTelemetry SDK default, tuned for durations in milliseconds.
 * Boundary: a frozen list, ascending; a value equal to a bound falls in that bound's bucket.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); the OpenTelemetry SDK default explicit-bucket aggregation.
 */

/** The bucket upper bounds. */
export const HISTOGRAM_BOUNDS: readonly number[] = Object.freeze([
  0, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10_000,
]);
