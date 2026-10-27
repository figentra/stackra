/**
 * Stackra file contract:
 * Purpose: unit tests of the `posthog` `FlagProvider` driver: the request it sends (endpoint, key, subject, tenant
 *          group), the key mapping back from PostHog's hyphen, a malformed answer ignored, no request for an anonymous
 *          subject, and the errors for a missing key and an error status.
 * Boundary: test only; `fetch` is stubbed, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 3); ADR 0071.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { FlagProvider } from "#contracts/ports/flag-provider.port";
import { PosthogFlagProviderDriver } from "#core/drivers/posthog-flag-provider.driver";

const config = buildConfig(FeatureFlagsConfig, {
  values: { provider: "posthog", posthogKey: "phc_test", posthogHost: "https://eu.i.posthog.com/" },
});

/** Stubs `fetch` with one answer and returns the spy. */
function answer(body: unknown, status = 200) {
  const fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PosthogFlagProviderDriver", () => {
  it("is a driver of FlagProvider", () => {
    expect(new PosthogFlagProviderDriver(config)).toBeInstanceOf(FlagProvider);
    expect(kindOf(PosthogFlagProviderDriver)).toEqual({
      kind: "driver",
      options: { port: FlagProvider },
    });
  });

  it("asks the flags endpoint for the subject with the tenant group", async () => {
    const fetch = answer({ flags: {} });
    await new PosthogFlagProviderDriver(config).values({ subject: "usr_1", scope: "ten_1" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://eu.i.posthog.com/flags/?v=2");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      api_key: "phc_test",
      distinct_id: "usr_1",
      groups: { tenant: "ten_1" },
    });
  });

  it("sends no group without a tenant", async () => {
    const fetch = answer({ flags: {} });
    await new PosthogFlagProviderDriver(config).values({ subject: "vis_1", scope: null });
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).groups).toEqual({});
  });

  it("maps PostHog keys back to flag keys and ignores malformed entries", async () => {
    answer({
      flags: {
        "web-help_centre": { key: "web-help_centre", enabled: true },
        "orders-quick_order": { enabled: false },
        "web-broken": { enabled: "yes" },
        "web-empty": null,
      },
    });
    await expect(
      new PosthogFlagProviderDriver(config).values({ subject: "usr_1", scope: null }),
    ).resolves.toEqual({ "web.help_centre": true, "orders.quick_order": false });
  });

  it("never asks for an anonymous subject", async () => {
    const fetch = answer({ flags: {} });
    await expect(
      new PosthogFlagProviderDriver(config).values({ subject: null, scope: "ten_1" }),
    ).resolves.toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws without a PostHog key", async () => {
    const fetch = answer({ flags: {} });
    const keyless = buildConfig(FeatureFlagsConfig, { values: { posthogKey: "" } });
    await expect(
      new PosthogFlagProviderDriver(keyless).values({ subject: "usr_1", scope: null }),
    ).rejects.toThrow(/posthogKey is not set/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws on an error status", async () => {
    answer({ error: "nope" }, 503);
    await expect(
      new PosthogFlagProviderDriver(config).values({ subject: "usr_1", scope: null }),
    ).rejects.toThrow(/HTTP 503/);
  });
});
