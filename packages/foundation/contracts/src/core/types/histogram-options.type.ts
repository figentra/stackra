/**
 * Stackra file contract:
 * Purpose: `HistogramOptions`, what a histogram recording may advise its exporter: the unit of its values (`s`, `ms`,
 *          `By`) and the explicit bucket bounds that fit them, so a histogram recorded in seconds is bucketed in
 *          seconds (the OpenTelemetry "advisory bucket boundaries").
 * Boundary: a type only. Advice: a driver applies it to the series it starts and may ignore it; a series keeps the
 *           bounds it started with. Bounds ascend and are finite.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1: OpenTelemetry metrics); the OpenTelemetry metrics API (instrument advice).
 */

/** The advice of one histogram recording. */
export type HistogramOptions = {
  /** The unit of the values, as the OpenTelemetry semantic conventions write it (`s`, `ms`, `By`). */
  readonly unit?: string;
  /** The explicit bucket upper bounds, ascending; omitted, the driver uses its default (tuned for milliseconds). */
  readonly bounds?: readonly number[];
};
