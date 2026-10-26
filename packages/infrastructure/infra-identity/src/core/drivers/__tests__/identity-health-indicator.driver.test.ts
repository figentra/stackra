/**
 * Stackra file contract:
 * Purpose: unit tests of `IdentityHealthIndicatorDriver`: a `HealthIndicator` named `identity` that GETs its target, reports `up` with
 *          a latency, maps the answer's status, and reports `down` (never throws) when the request fails.
 * Boundary: test only; `fetch` is a fake, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); registry gaps R-27 and R-36.
 */
import { HealthIndicator } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IdentityHealthIndicatorDriver } from "#core/drivers/identity-health-indicator.driver";

/** The URLs the fake fetch was asked for. */
const asked: string[] = [];

/** An indicator whose fetch answers `status`, or throws when `status` is `null`. */
function indicatorAnswering(status: number | null): IdentityHealthIndicatorDriver {
  const fetch = (async (url: string | URL | Request) => {
    asked.push(String(url));
    if (status === null) throw new TypeError("fetch failed");
    return new Response(null, { status });
  }) as typeof globalThis.fetch;
  return new IdentityHealthIndicatorDriver({ domain: "id.acme.example", fetch });
}

describe("IdentityHealthIndicatorDriver", () => {
  it("is a named health indicator that GETs its target", async () => {
    const indicator = indicatorAnswering(200);
    expect(indicator).toBeInstanceOf(HealthIndicator);
    expect(indicator.name).toBe("identity");
    const report = await indicator.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(asked.at(-1)).toBe("https://id.acme.example/.well-known/openid-configuration");
  });

  it("is down on any answer but a success", async () => {
    expect((await indicatorAnswering(404).check()).status).toBe("down");
    expect((await indicatorAnswering(503).check()).detail).toMatch(/answered 503/);
  });

  it("is down, without throwing, when the request fails", async () => {
    expect(await indicatorAnswering(null).check()).toEqual({
      status: "down",
      detail: `${new URL("https://id.acme.example/.well-known/openid-configuration").host} did not answer (TypeError)`,
    });
  });

  it("refuses a malformed target", () => {
    expect(() => new IdentityHealthIndicatorDriver({ domain: "https://id" })).toThrow(TypeError);
  });
});
