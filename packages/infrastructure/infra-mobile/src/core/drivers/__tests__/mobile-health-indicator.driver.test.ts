/**
 * Stackra file contract:
 * Purpose: unit tests of `MobileHealthIndicatorDriver`: a `HealthIndicator` named `eas` that GETs its target, reports `up` with
 *          a latency, maps the answer's status, and reports `down` (never throws) when the request fails.
 * Boundary: test only; the global `fetch` is stubbed, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); registry gaps R-27 and R-36.
 */
import { buildConfig } from "@stackra/config";
import { HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { InfraMobileConfig } from "#config/infra-mobile.config";
import { MobileHealthIndicatorDriver } from "#core/drivers/mobile-health-indicator.driver";

/** The URLs the fake fetch was asked for. */
const asked: string[] = [];

/** An indicator whose fetch answers `status`, or throws when `status` is `null`. */
function indicatorAnswering(status: number | null): MobileHealthIndicatorDriver {
  const fetch = (async (url: string | URL | Request) => {
    asked.push(String(url));
    if (status === null) throw new TypeError("fetch failed");
    return new Response(null, { status });
  }) as typeof globalThis.fetch;
  vi.stubGlobal("fetch", fetch);
  return new MobileHealthIndicatorDriver(
    buildConfig(InfraMobileConfig, {
      values: { projectId: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0" },
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MobileHealthIndicatorDriver", () => {
  it("is a named health indicator that GETs its target", async () => {
    const indicator = indicatorAnswering(200);
    expect(indicator).toBeInstanceOf(HealthIndicator);
    expect(indicator.name).toBe("eas");
    const report = await indicator.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(asked.at(-1)).toBe("https://u.expo.dev/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0");
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
      detail: `${new URL("https://u.expo.dev/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0").host} did not answer (TypeError)`,
    });
  });

  it("refuses a malformed target", () => {
    expect(() => buildConfig(InfraMobileConfig, { values: { projectId: "acme" } })).toThrow();
    expect(() => new MobileHealthIndicatorDriver(buildConfig(InfraMobileConfig))).toThrow(
      TypeError,
    );
  });
});
