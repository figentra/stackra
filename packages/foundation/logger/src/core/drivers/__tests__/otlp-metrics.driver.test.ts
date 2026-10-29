/**
 * Stackra file contract:
 * Purpose: unit tests of `OtlpMetricsDriver`: it is the `Metrics` port; counters, gauges and histograms are POSTed to
 *          `<endpoint>/v1/metrics` as OTLP/JSON (cumulative monotonic sums, gauges, cumulative explicit-bucket
 *          histograms) with one data point per attribute set; values stay cumulative across exports; the interval
 *          exports on its own; bad values and a failing collector never reach the caller.
 * Boundary: test only; `fetch` is stubbed and timers are faked, so nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Metrics } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OtlpConfig } from "#config/otlp.config";
import { HISTOGRAM_BOUNDS } from "#core/constants/histogram-bounds.constant";
import { OtlpMetricsDriver } from "#core/drivers/otlp-metrics.driver";

class NoSecrets extends SecretStore {
  get(): string | undefined {
    return undefined;
  }
}

interface SentMetric {
  name: string;
  sum?: { aggregationTemporality: number; isMonotonic: boolean; dataPoints: Point[] };
  gauge?: { dataPoints: Point[] };
  histogram?: { aggregationTemporality: number; dataPoints: Point[] };
}

interface Point {
  attributes: { key: string; value: Record<string, unknown> }[];
  startTimeUnixNano: string;
  timeUnixNano: string;
  asDouble?: number;
  count?: string;
  sum?: number;
  min?: number;
  max?: number;
  explicitBounds?: number[];
  bucketCounts?: string[];
}

function driver(values: Record<string, unknown> = {}): OtlpMetricsDriver {
  return new OtlpMetricsDriver(
    buildConfig(OtlpConfig, {
      values: { endpoint: "https://otlp.example.test", serviceName: "orders", ...values },
    }),
    new NoSecrets(),
  );
}

/** The metrics of request `index`. */
function metrics(fetch: ReturnType<typeof vi.fn>, index: number): SentMetric[] {
  const body = JSON.parse(
    String((fetch.mock.calls[index]?.[1] as RequestInit | undefined)?.body),
  ) as {
    resourceMetrics: { scopeMetrics: { metrics: SentMetric[] }[] }[];
  };
  return body.resourceMetrics[0]?.scopeMetrics[0]?.metrics ?? [];
}

let fetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetch = vi.fn(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetch);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe(OtlpMetricsDriver, () => {
  it("is Metrics", () => {
    expect(driver()).toBeInstanceOf(Metrics);
  });

  it("exports cumulative sums per attribute set, gauges and explicit-bucket histograms", async () => {
    const meter = driver();
    meter.counter("orders.created", 1, { scopeId: "s1" });
    meter.counter("orders.created", 2, { scopeId: "s1" });
    meter.counter("orders.created", 5, { scopeId: "s2" });
    meter.gauge("outbox.depth", 7);
    meter.gauge("outbox.depth", 3);
    meter.histogram("orders.create.duration_ms", 4);
    meter.histogram("orders.create.duration_ms", 30);
    meter.histogram("orders.create.duration_ms", 99_999);
    await meter.flush();
    const [url] = fetch.mock.calls[0] as [string];
    expect(url).toBe("https://otlp.example.test/v1/metrics");
    const [sum, gauge, histogram] = metrics(fetch, 0);
    expect(sum?.name).toBe("orders.created");
    expect(sum?.sum).toMatchObject({ aggregationTemporality: 2, isMonotonic: true });
    expect(sum?.sum?.dataPoints.map((point) => [point.attributes, point.asDouble])).toEqual([
      [[{ key: "scopeId", value: { stringValue: "s1" } }], 3],
      [[{ key: "scopeId", value: { stringValue: "s2" } }], 5],
    ]);
    expect(gauge).toMatchObject({ name: "outbox.depth", gauge: { dataPoints: [{ asDouble: 3 }] } });
    const point = histogram?.histogram?.dataPoints[0];
    expect(histogram?.histogram?.aggregationTemporality).toBe(2);
    expect(point).toMatchObject({ count: "3", sum: 100_033, min: 4, max: 99_999 });
    expect(point?.explicitBounds).toEqual([...HISTOGRAM_BOUNDS]);
    const buckets = point?.bucketCounts ?? [];
    expect(buckets).toHaveLength(HISTOGRAM_BOUNDS.length + 1);
    expect(buckets[HISTOGRAM_BOUNDS.indexOf(5)]).toBe("1");
    expect(buckets[HISTOGRAM_BOUNDS.indexOf(50)]).toBe("1");
    expect(buckets.at(-1)).toBe("1");
    expect(BigInt(point?.timeUnixNano ?? 0)).toBeGreaterThanOrEqual(
      BigInt(point?.startTimeUnixNano ?? 0),
    );
  });

  it("keeps values cumulative across exports, and exports on its interval", async () => {
    const meter = driver({ metricIntervalMs: 1000, flushIntervalMs: 100 });
    meter.counter("jobs.run", 2);
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(100);
    meter.counter("jobs.run", 1);
    await meter.onApplicationShutdown();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(metrics(fetch, 0)[0]?.sum?.dataPoints[0]?.asDouble).toBe(2);
    expect(metrics(fetch, 1)[0]?.sum?.dataPoints[0]?.asDouble).toBe(3);
  });

  it("ignores bad values, caps the series and never throws when the collector fails", async () => {
    fetch.mockRejectedValue(new Error("down"));
    const meter = driver({ maxQueue: 1 });
    expect(() => {
      meter.counter("a", -1);
      meter.counter("a", Number.NaN);
      meter.histogram("b", Number.POSITIVE_INFINITY);
      meter.gauge("c", 1);
      meter.gauge("d", 1);
    }).not.toThrow();
    await expect(meter.flush()).resolves.toBeUndefined();
    expect(metrics(fetch, 0).map((metric) => metric.name)).toEqual(["c"]);
    expect(meter.dropped).toBe(1);
  });

  it("records nothing without an endpoint", async () => {
    const meter = driver({ endpoint: "" });
    meter.counter("a", 1);
    await meter.flush();
    expect(fetch).not.toHaveBeenCalled();
  });
});
