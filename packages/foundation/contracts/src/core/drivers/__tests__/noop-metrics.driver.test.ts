/**
 * Stackra file contract:
 * Purpose: unit tests of `NoopMetricsDriver`: it is the `Metrics` port and every call returns without effect.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { NoopMetricsDriver } from "#core/drivers/noop-metrics.driver";
import { Metrics } from "#core/ports/metrics.port";

describe("NoopMetricsDriver", () => {
  it("is Metrics that records nothing", () => {
    const metrics = new NoopMetricsDriver();
    expect(metrics).toBeInstanceOf(Metrics);
    expect(metrics.counter("a", 1, { b: true })).toBeUndefined();
    expect(metrics.histogram("a", 2)).toBeUndefined();
    expect(metrics.gauge("a", 3)).toBeUndefined();
  });
});
