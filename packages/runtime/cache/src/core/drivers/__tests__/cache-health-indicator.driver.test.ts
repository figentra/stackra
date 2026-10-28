/**
 * Stackra file contract:
 * Purpose: unit tests of `CacheHealthIndicatorDriver`: a `HealthIndicator` named `cache` that reads one never-written key, reports `up` with a latency,
 *          and reports `down` (never throws) when the probe fails or runs past `health.timeout`, or `degraded` when
 *          `health.critical` is off; the detail names the error, never its message.
 * Boundary: test only; the `Cache` is a fake that records every call, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     17); registry gap R-27.
 */
import { buildConfig } from "@stackra/config";
import { Duration, HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import { CacheHealthIndicatorDriver } from "#core/drivers/cache-health-indicator.driver";

/** Every call the fake `Cache` received, with all its arguments. */
const calls: unknown[][] = [];

/** An indicator over a fake whose probe resolves, rejects with `error`, or never settles (`"hang"`). */
function indicator(
  outcome: "answer" | Error | "hang",
  health: Partial<CacheConfig["health"]> = {},
): CacheHealthIndicatorDriver {
  const probe = (...args: unknown[]): Promise<unknown> => {
    calls.push(args);
    if (outcome === "hang") return new Promise(() => {});
    return outcome === "answer" ? Promise.resolve(undefined) : Promise.reject(outcome);
  };
  const port = { get: probe } as unknown as Cache;
  const config = buildConfig(CacheConfig, {
    values: { health: { timeout: Duration.seconds(2), critical: true, ...health } },
  });
  return new CacheHealthIndicatorDriver(port, config);
}

afterEach(() => {
  calls.length = 0;
  vi.useRealTimers();
});

describe("CacheHealthIndicatorDriver", () => {
  it("is a health indicator named cache that reads one never-written key", async () => {
    const probe = indicator("answer");
    expect(probe).toBeInstanceOf(HealthIndicator);
    expect(probe.name).toBe("cache");
    const report = await probe.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(calls).toEqual([["CacheHealthIndicatorDriver:probe"]]);
  });

  it("is down, without throwing, when the probe fails, naming the error but not its message", async () => {
    const report = await indicator(new TypeError("connect ECONNREFUSED secret.internal")).check();
    expect(report).toEqual({ status: "down", detail: "the cache did not answer (TypeError)" });
  });

  it("is degraded instead when the dependency is not critical", async () => {
    const report = await indicator(new Error("boom"), { critical: false }).check();
    expect(report.status).toBe("degraded");
  });

  it("is down once the probe runs past the configured timeout", async () => {
    vi.useFakeTimers();
    const pending = indicator("hang", {
      timeout: Duration.seconds(1),
    }).check();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({
      status: "down",
      detail: "the cache did not answer (TimeoutError)",
    });
  });
});
