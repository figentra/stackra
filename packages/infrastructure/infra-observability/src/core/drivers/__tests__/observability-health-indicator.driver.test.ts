/**
 * Stackra file contract:
 * Purpose: unit tests of `ObservabilityHealthIndicatorDriver`: a `HealthIndicator` named `telemetry` that GETs its target, reports `up` with
 *          a latency, maps the answer's status, and reports `down` (never throws) when the request fails.
 * Boundary: test only; the global `fetch` is stubbed, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); registry gaps R-27 and R-36.
 */
import { buildConfig } from "@stackra/config";
import { HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { InfraObservabilityConfig } from "#config/infra-observability.config";
import { ObservabilityHealthIndicatorDriver } from "#core/drivers/observability-health-indicator.driver";

/** The URLs the fake fetch was asked for. */
const asked: string[] = [];

/** An indicator whose fetch answers `status`, or throws when `status` is `null`. */
function indicatorAnswering(status: number | null): ObservabilityHealthIndicatorDriver {
  const fetch = (async (url: string | URL | Request) => {
    asked.push(String(url));
    if (status === null) throw new TypeError("fetch failed");
    return new Response(null, { status });
  }) as typeof globalThis.fetch;
  vi.stubGlobal("fetch", fetch);
  return new ObservabilityHealthIndicatorDriver(
    buildConfig(InfraObservabilityConfig, { values: { url: "https://otel.acme.example/v1/logs" } }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ObservabilityHealthIndicatorDriver", () => {
  it("is a named health indicator that GETs its target", async () => {
    const indicator = indicatorAnswering(200);
    expect(indicator).toBeInstanceOf(HealthIndicator);
    expect(indicator.name).toBe("telemetry");
    const report = await indicator.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(asked.at(-1)).toBe("https://otel.acme.example/v1/logs");
  });

  it("is up while the endpoint answers below 500, even refusing an unsigned request", async () => {
    expect((await indicatorAnswering(403).check()).status).toBe("up");
  });

  it("is degraded when rate limited and down from 500", async () => {
    expect((await indicatorAnswering(429).check()).status).toBe("degraded");
    expect(await indicatorAnswering(503).check()).toMatchObject({ status: "down" });
  });

  it("is down, without throwing, when the request fails", async () => {
    expect(await indicatorAnswering(null).check()).toEqual({
      status: "down",
      detail: `${new URL("https://otel.acme.example/v1/logs").host} did not answer (TypeError)`,
    });
  });

  it("refuses a malformed target", () => {
    expect(() =>
      buildConfig(InfraObservabilityConfig, { values: { url: "http://otel" } }),
    ).toThrow();
    expect(
      () => new ObservabilityHealthIndicatorDriver(buildConfig(InfraObservabilityConfig)),
    ).toThrow(TypeError);
  });
});
