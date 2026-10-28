/**
 * Stackra file contract:
 * Purpose: unit tests of the `CacheMetrics` drivers: `none` records nothing, `counting` adds each observation to its
 *          owner's counters (loads count once and add their milliseconds) and hands out a copy, and `logger` writes one
 *          debug line per load and per eviction with the owner and a number only.
 * Boundary: test only; the logger is a test-local recording driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 4).
 */
import { Driver } from "@stackra/container";
import { Logger } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import { CountingCacheMetricsDriver } from "#core/drivers/counting-cache-metrics.driver";
import { LoggerCacheMetricsDriver } from "#core/drivers/logger-cache-metrics.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";

/** Keeps every debug line. */
class RecordingLogger extends Driver(Logger) {
  readonly lines: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  debug(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push([event, fields]);
  }

  info(): void {
    // Not used by the driver under test.
  }

  warn(): void {
    // Not used by the driver under test.
  }

  error(): void {
    // Not used by the driver under test.
  }
}

describe("CacheMetrics drivers", () => {
  it("are drivers of the CacheMetrics port", () => {
    expect(new NoneCacheMetricsDriver()).toBeInstanceOf(CacheMetrics);
    expect(new CountingCacheMetricsDriver()).toBeInstanceOf(CacheMetrics);
    expect(new LoggerCacheMetricsDriver(new RecordingLogger())).toBeInstanceOf(CacheMetrics);
  });

  it("none records nothing and never throws", () => {
    expect(() =>
      new NoneCacheMetricsDriver().record({ event: "hit", owner: "Product", value: 1 }),
    ).not.toThrow();
  });

  it("counting adds each observation to its owner's counters", () => {
    const metrics = new CountingCacheMetricsDriver();
    metrics.record({ event: "hit", owner: "Product", value: 1 });
    metrics.record({ event: "hit", owner: "Product", value: 1 });
    metrics.record({ event: "stale", owner: "Product", value: 1 });
    metrics.record({ event: "miss", owner: "Product", value: 1 });
    metrics.record({ event: "load", owner: "Product", value: 12.5 });
    metrics.record({ event: "load", owner: "Product", value: 7.5 });
    metrics.record({ event: "evict", owner: "Product", value: 3 });
    metrics.record({ event: "miss", owner: "Category", value: 1 });
    expect(metrics.snapshot().get("Product")).toEqual({
      hits: 2,
      stale: 1,
      misses: 1,
      loads: 2,
      loadMilliseconds: 20,
      evictions: 3,
    });
    expect(metrics.snapshot().get("Category")).toMatchObject({ misses: 1, hits: 0 });
  });

  it("counting hands out a copy", () => {
    const metrics = new CountingCacheMetricsDriver();
    const before = metrics.snapshot();
    metrics.record({ event: "hit", owner: "Product", value: 1 });
    expect(before.size).toBe(0);
  });

  it("logger writes loads and evictions only, with the owner and a number", () => {
    const logger = new RecordingLogger();
    const metrics = new LoggerCacheMetricsDriver(logger);
    metrics.record({ event: "hit", owner: "Product", value: 1 });
    metrics.record({ event: "miss", owner: "Product", value: 1 });
    metrics.record({ event: "load", owner: "Product", value: 12 });
    metrics.record({ event: "evict", owner: "Product", value: 2 });
    expect(logger.lines).toEqual([
      ["cache.load", { owner: "Product", milliseconds: 12 }],
      ["cache.evict", { owner: "Product", count: 2 }],
    ]);
  });
});
