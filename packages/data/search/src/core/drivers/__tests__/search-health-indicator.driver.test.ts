/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchHealthIndicatorDriver`: a `HealthIndicator` named `search` that searches the probe table for one id, reports `up` with a latency,
 *          and reports `down` (never throws) when the probe fails or runs past `health.timeout`, or `degraded` when
 *          `health.critical` is off; the detail names the error, never its message. It refuses an empty probe table, and a table with no schema searches the current one.
 * Boundary: test only; the `SearchDriver` is a fake that records every call, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     17); registry gap R-27.
 */
import { buildConfig } from "@stackra/config";
import { Duration, HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchConfig } from "#config/search.config";
import type { SearchDriver } from "#contracts/ports/search-driver.port";
import { SearchHealthIndicatorDriver } from "#core/drivers/search-health-indicator.driver";

/** Every call the fake `SearchDriver` received, with all its arguments. */
const calls: unknown[][] = [];

/** An indicator over a fake whose probe resolves, rejects with `error`, or never settles (`"hang"`). */
function indicator(
  outcome: "answer" | Error | "hang",
  health: Partial<SearchConfig["health"]> = {},
): SearchHealthIndicatorDriver {
  const probe = (...args: unknown[]): Promise<unknown> => {
    calls.push(args);
    if (outcome === "hang") return new Promise(() => undefined);
    return outcome === "answer" ? Promise.resolve([]) : Promise.reject(outcome);
  };
  const port = { search: probe } as unknown as SearchDriver;
  const config = buildConfig(SearchConfig, {
    values: {
      health: {
        timeout: Duration.seconds(2),
        critical: true,
        table: "catalog.products",
        primaryKey: "id",
        ...health,
      },
    },
  });
  return new SearchHealthIndicatorDriver(port, config);
}

afterEach(() => {
  calls.length = 0;
  vi.useRealTimers();
});

describe("SearchHealthIndicatorDriver", () => {
  it("is a health indicator named search that searches the probe table for one id", async () => {
    const probe = indicator("answer");
    expect(probe).toBeInstanceOf(HealthIndicator);
    expect(probe.name).toBe("search");
    const report = await probe.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(calls).toEqual([
      [
        { schema: "catalog", table: "products", primaryKey: "id" },
        { words: [], filters: {}, offset: 0, limit: 1 },
      ],
    ]);
  });

  it("is down, without throwing, when the probe fails, naming the error but not its message", async () => {
    const report = await indicator(new TypeError("connect ECONNREFUSED secret.internal")).check();
    expect(report).toEqual({
      status: "down",
      detail: "the search engine did not answer (TypeError)",
    });
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
      detail: "the search engine did not answer (TimeoutError)",
    });
  });

  it("searches a table with no schema in the connection's current schema", async () => {
    await indicator("answer", { table: "products" }).check();
    expect(calls.at(-1)?.[0]).toEqual({ table: "products", primaryKey: "id" });
  });

  it("refuses an empty probe table", () => {
    expect(() => indicator("answer", { table: "" })).toThrow(TypeError);
  });
});
