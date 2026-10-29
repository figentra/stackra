/**
 * Stackra file contract:
 * Purpose: the OTLP driver of the `Metrics` port (driver name `otlp`): counters, histograms and gauges are aggregated in
 *          memory per name and attribute set, and every `metricIntervalMs` their cumulative values are POSTed as
 *          OTLP/JSON to `<endpoint>/v1/metrics` (monotonic sums, gauges, explicit-bucket histograms).
 * Boundary: no vendor SDK: web-standard `fetch` only. Recording never throws: a negative counter delta or a non-finite
 *           value is ignored, and past `maxQueue` distinct series a new one is dropped, so a runaway attribute cannot
 *           grow memory without bound. Values are cumulative, so a lost send loses no count: the next export carries
 *           it. With no endpoint nothing is recorded. `flush()` and shutdown export once more and wait.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1: OpenTelemetry, OTLP for every signal); ADR 0147 (decision 3); ADR 0173.
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import { Metrics } from "@stackra/contracts";
import type { TraceAttributes } from "@stackra/contracts";

import type { OtlpConfig } from "#config/otlp.config";
import { HISTOGRAM_BOUNDS } from "#core/constants/histogram-bounds.constant";
import { otlpExporter } from "#core/functions/otlp-exporter.function";
import { otlpMetricsBody } from "#core/functions/otlp-metrics-body.function";
import type { MetricPoint } from "#core/types/metric-point.type";
import type { OtlpExporter } from "#core/types/otlp-exporter.type";

/** One aggregated series: a metric name, kind and attribute set. */
interface Series {
  readonly kind: MetricPoint["kind"];
  readonly name: string;
  readonly attributes: TraceAttributes;
  value: number;
  count: number;
  min: number;
  max: number;
  readonly bucketCounts: number[];
}

/**
 * Sends metrics to an OpenTelemetry collector.
 *
 * @example
 * metrics.counter("orders.created", 1, { scopeId });
 * metrics.histogram("orders.create.duration_ms", 42);
 * await metrics.flush();
 */
export class OtlpMetricsDriver extends Driver(Metrics) {
  private readonly config: OtlpConfig;

  private readonly exporter: OtlpExporter<MetricPoint>;

  private readonly series = new Map<string, Series>();

  private readonly startMs = Date.now();

  private timer: ReturnType<typeof setInterval> | undefined;

  /**
   * @param config - the collector, the service name, the headers secret's name, the bounds and the interval.
   * @param secrets - the store the headers are read from.
   */
  constructor(config: OtlpConfig, secrets: SecretStore) {
    super();
    this.config = config;
    this.exporter = otlpExporter(config, secrets, "metrics", (batch) =>
      otlpMetricsBody(batch, config.serviceName),
    );
  }

  /** Points dropped so far (queue overflow, or a batch the collector refused or never answered). */
  get dropped(): number {
    return this.exporter.dropped;
  }

  /** Exports once more and stops the interval before the container closes. */
  async onApplicationShutdown(): Promise<void> {
    clearInterval(this.timer);
    this.timer = undefined;
    await this.flush();
  }

  /** Adds `delta` to the counter; a negative or non-finite delta is ignored. */
  counter(name: string, delta: number, attributes: TraceAttributes = {}): void {
    if (!Number.isFinite(delta) || delta < 0) return;
    const series = this.at("sum", name, attributes);
    if (series !== undefined) series.value += delta;
  }

  /** Records `value` in the histogram; a non-finite value is ignored. */
  histogram(name: string, value: number, attributes: TraceAttributes = {}): void {
    if (!Number.isFinite(value)) return;
    const series = this.at("histogram", name, attributes);
    if (series === undefined) return;
    series.value += value;
    series.count += 1;
    series.min = Math.min(series.min, value);
    series.max = Math.max(series.max, value);
    const found = HISTOGRAM_BOUNDS.findIndex((bound) => value <= bound);
    const bucket = found === -1 ? HISTOGRAM_BOUNDS.length : found;
    series.bucketCounts[bucket] = (series.bucketCounts[bucket] ?? 0) + 1;
  }

  /** Sets the gauge; a non-finite value is ignored. */
  gauge(name: string, value: number, attributes: TraceAttributes = {}): void {
    if (!Number.isFinite(value)) return;
    const series = this.at("gauge", name, attributes);
    if (series !== undefined) series.value = value;
  }

  /** Exports the current values and resolves once every send has finished or failed. */
  flush(): Promise<void> {
    this.collect();
    return this.exporter.flush();
  }

  /** The series of `kind`, `name` and `attributes`, made on first use; `undefined` when recording is off or full. */
  private at(
    kind: MetricPoint["kind"],
    name: string,
    attributes: TraceAttributes,
  ): Series | undefined {
    if (this.config.endpoint === "") return undefined;
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a fresh entries array nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const key = `${kind}\u0000${name}\u0000${JSON.stringify(Object.entries(attributes).sort(([a], [b]) => (a < b ? -1 : 1)))}`;
    let series = this.series.get(key);
    if (series === undefined) {
      if (this.series.size >= this.config.maxQueue) return undefined;
      series = {
        kind,
        name,
        attributes: { ...attributes },
        value: 0,
        count: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        bucketCounts: Array.from({ length: HISTOGRAM_BOUNDS.length + 1 }, () => 0),
      };
      this.series.set(key, series);
    }
    this.start();
    return series;
  }

  /** Queues one point per series with the values as they are now. */
  private collect(): void {
    const timeMs = Date.now();
    for (const series of this.series.values()) {
      const base = {
        name: series.name,
        attributes: series.attributes,
        startMs: this.startMs,
        timeMs,
      };
      if (series.kind !== "histogram") {
        this.exporter.push({ ...base, kind: series.kind, value: series.value });
        continue;
      }
      if (series.count === 0) continue;
      this.exporter.push({
        ...base,
        kind: "histogram",
        count: series.count,
        sum: series.value,
        min: series.min,
        max: series.max,
        bounds: HISTOGRAM_BOUNDS,
        bucketCounts: [...series.bucketCounts],
      });
    }
  }

  /** Starts the export interval once. */
  private start(): void {
    if (this.timer !== undefined) return;
    this.timer = setInterval(() => this.collect(), this.config.metricIntervalMs);
    // The export interval must not keep a Node process alive; Workers and browsers have no `unref`.
    (this.timer as { unref?: () => void }).unref?.();
  }
}
