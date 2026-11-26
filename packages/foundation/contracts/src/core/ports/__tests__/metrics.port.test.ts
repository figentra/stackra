/**
 * Stackra file contract:
 * Purpose: unit tests of the `Metrics` port: a port an implementation extends, with a counter, a histogram and a gauge
 *          that take a name, a number and optional attributes.
 * Boundary: test only; a recording driver stands in for the OTLP driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { Metrics } from "#core/ports/metrics.port";
import { HTTP_SERVER_DURATION } from "#core/constants/http-server-duration.constant";
import type { HistogramOptions } from "#core/types/histogram-options.type";
import type { TraceAttributes } from "#core/types/trace-attributes.type";

class RecordingMetrics extends Metrics {
  readonly seen: [string, string, number, TraceAttributes | undefined, HistogramOptions?][] = [];

  counter(name: string, delta: number, attributes?: TraceAttributes): void {
    this.seen.push(["counter", name, delta, attributes]);
  }

  histogram(
    name: string,
    value: number,
    attributes?: TraceAttributes,
    options?: HistogramOptions,
  ): void {
    this.seen.push(
      options === undefined
        ? ["histogram", name, value, attributes]
        : ["histogram", name, value, attributes, options],
    );
  }

  gauge(name: string, value: number, attributes?: TraceAttributes): void {
    this.seen.push(["gauge", name, value, attributes]);
  }
}

describe("Metrics", () => {
  it("is a port an implementation extends", () => {
    expect(new RecordingMetrics()).toBeInstanceOf(Metrics);
    expect(Object.getPrototypeOf(Metrics)).toBe(Port);
  });

  it("records counters, histograms and gauges with their attributes", () => {
    const metrics = new RecordingMetrics();
    metrics.counter("orders.created", 1, { scopeId: "s1" });
    metrics.histogram("orders.create.duration_ms", 12.5);
    metrics.gauge("outbox.depth", 3);
    expect(metrics.seen).toEqual([
      ["counter", "orders.created", 1, { scopeId: "s1" }],
      ["histogram", "orders.create.duration_ms", 12.5, undefined],
      ["gauge", "outbox.depth", 3, undefined],
    ]);
  });

  it("takes a histogram's advised unit and bounds", () => {
    const metrics = new RecordingMetrics();
    const { name, unit, bounds } = HTTP_SERVER_DURATION;
    metrics.histogram(name, 0.042, { "http.route": "/orders" }, { unit, bounds });
    expect(metrics.seen).toEqual([
      ["histogram", name, 0.042, { "http.route": "/orders" }, { unit: "s", bounds }],
    ]);
  });
});
