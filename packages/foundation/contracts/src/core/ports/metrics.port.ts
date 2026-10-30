/**
 * Stackra file contract:
 * Purpose: the Metrics port: records operational numbers (counters, histograms and gauges) that a host exports as
 *          OpenTelemetry metrics, so a service, a worker and a relay report their rates and latencies one way.
 * Boundary: an abstract class that is its own token. The OTLP driver ships in @stackra/logger (`OtlpMetricsDriver`, no
 *           vendor SDK); this package ships the no-op driver. Every call is synchronous and never throws: recording a
 *           number never fails its caller. Attributes follow `TraceAttributes` (ids and codes, never values). This is
 *           operations telemetry, not usage metering (`MeterKind`, ADR 0216), which bills.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1: OpenTelemetry, OTLP for all three signals); ADR 0147 (decision 3); ADR
 *                     0263 (ports resolve by type).
 */
import { Port } from "#core/bases/port.base";
import type { TraceAttributes } from "#core/types/trace-attributes.type";

/**
 * The port that records counters, histograms and gauges for the metrics exporter.
 *
 * @example
 * this.metrics.counter("orders.created", 1, { scopeId });
 * this.metrics.histogram("orders.create.duration_ms", latencyMs, { outcome: "ok" });
 */
export abstract class Metrics extends Port {
  /** Adds `delta` (zero or more) to the monotonic counter `name`. */
  abstract counter(name: string, delta: number, attributes?: TraceAttributes): void;

  /** Records one `value` in the histogram `name` (a duration in milliseconds, a size in bytes). */
  abstract histogram(name: string, value: number, attributes?: TraceAttributes): void;

  /** Sets the gauge `name` to `value` (a queue depth, a pool size). */
  abstract gauge(name: string, value: number, attributes?: TraceAttributes): void;
}
