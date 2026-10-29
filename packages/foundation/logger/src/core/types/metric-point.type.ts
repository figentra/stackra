/**
 * Stackra file contract:
 * Purpose: `MetricPoint`, one cumulative value the OTLP metrics driver collected for one metric and one attribute set:
 *          a counter's sum, a gauge's last value, or a histogram's count, sum, bounds and bucket counts.
 * Boundary: a type only. Times are unix milliseconds (the encoder writes nanoseconds); `startMs` is when the driver
 *           began counting, so every sum and histogram is cumulative. Attributes are ids and codes, never values.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); ADR 0147 (decision 3); the OTLP metrics data model.
 */
import type { TraceAttributes } from "@stackra/contracts";

/** What every point carries. */
interface PointBase {
  readonly name: string;

  readonly attributes: TraceAttributes;

  readonly startMs: number;

  readonly timeMs: number;
}

/** A monotonic counter's total, or a gauge's last value. */
interface ValuePoint extends PointBase {
  readonly kind: "sum" | "gauge";

  readonly value: number;
}

/** An explicit-bucket histogram: `bucketCounts` has one more entry than `bounds`. */
interface HistogramPoint extends PointBase {
  readonly kind: "histogram";

  readonly count: number;

  readonly sum: number;

  readonly min: number;

  readonly max: number;

  readonly bounds: readonly number[];

  readonly bucketCounts: readonly number[];
}

/** One collected value. */
export type MetricPoint = ValuePoint | HistogramPoint;
