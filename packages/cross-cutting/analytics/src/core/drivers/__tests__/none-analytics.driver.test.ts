/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneAnalyticsDriver`: a driver of `AnalyticsDriver`, recorded with its port, that resolves
 *          and sends nothing, and erases 0 persons without a request.
 * Boundary: test only; the global `fetch` is a spy, so any network attempt would show.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0298 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { NoneAnalyticsDriver } from "#core/drivers/none-analytics.driver";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NoneAnalyticsDriver", () => {
  it("is a driver of the port", () => {
    expect(new NoneAnalyticsDriver()).toBeInstanceOf(AnalyticsDriver);
    expect(kindOf(NoneAnalyticsDriver)).toEqual({
      kind: "driver",
      options: { port: AnalyticsDriver },
    });
  });

  it("resolves and sends nothing", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const driver: AnalyticsDriver = new NoneAnalyticsDriver();
    await expect(
      driver.send([
        {
          eventId: "evt_01jbadk0g0aaaaaaaaaaaaaaaa",
          anonymousId: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
          sessionId: "ses_01jbadk0g0cccccccccccccccc",
          context: { library: { name: "@stackra/analytics" } },
          name: "lead.submitted",
          properties: { plan: "pro" },
          occurredAt: "2026-10-24T09:00:00Z",
        },
      ]),
    ).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("erases 0 persons without a request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const driver: AnalyticsDriver = new NoneAnalyticsDriver();
    await expect(driver.erasePerson("usr_1")).resolves.toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
