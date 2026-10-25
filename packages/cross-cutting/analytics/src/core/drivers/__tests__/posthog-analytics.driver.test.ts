/**
 * Stackra file contract:
 * Purpose: unit tests of the `posthog` `AnalyticsDriver`: the batch request it sends (endpoint, key, events in order
 *          with their capture time, no person profile), one anonymous id per driver kept across sends, the ingest
 *          origin preferred over the host, no request for an empty list, and the errors for a missing key and an
 *          error status.
 * Boundary: test only; `fetch` is stubbed, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298; ADR 0071.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { PosthogAnalyticsDriver } from "#core/drivers/posthog-analytics.driver";

const config = buildConfig(AnalyticsConfig, {
  values: { driver: "posthog", posthogKey: "phc_test", posthogHost: "https://eu.i.posthog.com/" },
});

/** A delivery named `name`. */
const delivery = (name: string, properties: Record<string, unknown> = {}) => ({
  name,
  properties,
  occurredAt: "2026-10-25T09:00:00.000Z",
});

/** Stubs `fetch` with one status and returns the spy. */
function answer(status = 200) {
  const fetch = vi.fn(() => Promise.resolve(new Response("{}", { status })));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The URL and parsed body of the `index`th request. */
function request(fetch: ReturnType<typeof answer>, index = 0) {
  const [url, init] = fetch.mock.calls[index] as unknown as [string, RequestInit];
  return { url, init, body: JSON.parse(String(init.body)) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PosthogAnalyticsDriver", () => {
  it("is a driver of AnalyticsDriver", () => {
    expect(new PosthogAnalyticsDriver(config)).toBeInstanceOf(AnalyticsDriver);
    expect(kindOf(PosthogAnalyticsDriver)?.kind).toBe("driver");
  });

  it("posts the deliveries in order to the batch endpoint", async () => {
    const fetch = answer();
    await new PosthogAnalyticsDriver(config).send([
      delivery("lead.submitted", { plan: "pro" }),
      delivery("newsletter.joined"),
    ]);
    const { url, init, body } = request(fetch);
    expect(url).toBe("https://eu.i.posthog.com/batch/");
    expect(init.method).toBe("POST");
    expect(body.api_key).toBe("phc_test");
    expect(body.batch.map((event: { event: string }) => event.event)).toEqual([
      "lead.submitted",
      "newsletter.joined",
    ]);
    expect(body.batch[0]).toMatchObject({
      timestamp: "2026-10-25T09:00:00.000Z",
      properties: { plan: "pro", $process_person_profile: false },
    });
  });

  it("keeps one anonymous id per driver across sends", async () => {
    const fetch = answer();
    const driver = new PosthogAnalyticsDriver(config);
    await driver.send([delivery("a.one")]);
    await driver.send([delivery("a.two")]);
    const first = request(fetch, 0).body.batch[0].properties.distinct_id;
    expect(typeof first).toBe("string");
    expect(request(fetch, 1).body.batch[0].properties.distinct_id).toBe(first);
  });

  it("sends to the ingest origin when one is set", async () => {
    const fetch = answer();
    const proxied = buildConfig(AnalyticsConfig, {
      values: { posthogKey: "phc_test", ingestOrigin: "https://www.acme.example/ingest" },
    });
    await new PosthogAnalyticsDriver(proxied).send([delivery("lead.submitted")]);
    expect(request(fetch).url).toBe("https://www.acme.example/ingest/batch/");
  });

  it("requests nothing for an empty list", async () => {
    const fetch = answer();
    await new PosthogAnalyticsDriver(config).send([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws without a PostHog key", async () => {
    const fetch = answer();
    const keyless = buildConfig(AnalyticsConfig);
    await expect(
      new PosthogAnalyticsDriver(keyless).send([delivery("lead.submitted")]),
    ).rejects.toThrow(/posthogKey is not set/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws on an error status", async () => {
    answer(503);
    await expect(
      new PosthogAnalyticsDriver(config).send([delivery("lead.submitted")]),
    ).rejects.toThrow(/HTTP 503/);
  });
});
