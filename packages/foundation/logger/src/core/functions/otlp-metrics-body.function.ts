/**
 * Stackra file contract:
 * Purpose: `otlpMetricsBody(points, serviceName)`, the OTLP/JSON `ExportMetricsServiceRequest` for a batch of collected
 *          points: one resource, one scope (`@stackra/logger`), one metric per name and kind with a data point per
 *          attribute set: cumulative monotonic sums, gauges, and cumulative explicit-bucket histograms.
 * Boundary: pure. Counts are strings (64-bit in OTLP/JSON); values are doubles.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); the OTLP/JSON encoding and metrics data model.
 */
import { otlpResource } from "#core/functions/otlp-resource.function";
import { otlpValue } from "#core/functions/otlp-value.function";
import type { MetricPoint } from "#core/types/metric-point.type";

/** OTLP `AggregationTemporality.CUMULATIVE`. */
const CUMULATIVE = 2;

/** Unix milliseconds as the OTLP nanosecond string. */
const nanos = (ms: number): string => `${BigInt(Math.round(ms)) * 1_000_000n}`;

/** The OTLP/JSON data point of `point`. */
function dataPoint(point: MetricPoint): object {
  const common = {
    attributes: Object.entries(point.attributes).map(([key, value]) => ({
      key,
      value: otlpValue(value),
    })),
    startTimeUnixNano: nanos(point.startMs),
    timeUnixNano: nanos(point.timeMs),
  };
  if (point.kind !== "histogram") return { ...common, asDouble: point.value };
  return {
    ...common,
    count: String(point.count),
    sum: point.sum,
    min: point.min,
    max: point.max,
    explicitBounds: point.bounds,
    bucketCounts: point.bucketCounts.map(String),
  };
}

/**
 * The export request of `points`.
 *
 * @example
 * await fetch(`${endpoint}/v1/metrics`, { method: "POST", body: JSON.stringify(otlpMetricsBody(points, "orders")) });
 */
export function otlpMetricsBody(points: readonly MetricPoint[], serviceName: string): object {
  const metrics = new Map<string, { kind: MetricPoint["kind"]; name: string; points: object[] }>();
  for (const point of points) {
    const key = `${point.kind}\u0000${point.name}`;
    const metric = metrics.get(key) ?? { kind: point.kind, name: point.name, points: [] };
    metric.points.push(dataPoint(point));
    metrics.set(key, metric);
  }
  return {
    resourceMetrics: [
      {
        resource: otlpResource(serviceName),
        scopeMetrics: [
          {
            scope: { name: "@stackra/logger" },
            metrics: [...metrics.values()].map(({ kind, name, points: dataPoints }) => {
              if (kind === "gauge") return { name, gauge: { dataPoints } };
              if (kind === "sum")
                return {
                  name,
                  sum: { aggregationTemporality: CUMULATIVE, isMonotonic: true, dataPoints },
                };
              return { name, histogram: { aggregationTemporality: CUMULATIVE, dataPoints } };
            }),
          },
        ],
      },
    ],
  };
}
