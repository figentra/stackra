/**
 * Stackra file contract:
 * Purpose: unit tests of the `posthog` `AnalyticsDriver`: the batch request it sends (endpoint, key, events in order
 *          with their capture time, no person profile before identify), the envelope ids and page path mapped to PostHog,
 *          the user, groups, `$identify` and `$groupidentify` of identity stitching, the
 *          `sendBeacon` path for a closing page, the ingest
 *          origin preferred over the host, no request for an empty list, and the errors for a missing key and an
 *          error status; `erasePerson` finds the subject's persons by distinct id and deletes each with its events and
 *          recordings through the private API host, counts an already-deleted person, and rejects without the personal
 *          API key or project id and on an error status.
 * Boundary: test only; `fetch` is stubbed, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298; ADR 0071; ADR 0189 (decision 2); STA-1582.
 */
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { PosthogAnalyticsDriver } from "#core/drivers/posthog-analytics.driver";

const config = buildConfig(AnalyticsConfig, {
  values: { driver: "posthog", posthogKey: "phc_test", posthogHost: "https://eu.i.posthog.com/" },
});

/** A delivery named `name`. */
const delivery = (name: string, properties: Record<string, unknown> = {}) => ({
  eventId: "evt_01jbadk0g0aaaaaaaaaaaaaaaa",
  anonymousId: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
  sessionId: "ses_01jbadk0g0cccccccccccccccc",
  context: { library: { name: "@stackra/analytics" } },
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

/** A config with the private API set up, the personal key from the secret store. */
const eraseConfig = buildConfig(AnalyticsConfig, {
  values: {
    driver: "posthog",
    posthogApiHost: "https://posthog.acme.example/",
    posthogProjectId: "42",
  },
  secrets: new MemorySecretStoreDriver().set("ANALYTICS_POSTHOG_PERSONAL_API_KEY", "phx_test"),
});

/** Stubs `fetch`: the lookup finds `ids`, each delete answers `deleteStatus`. */
function persons(ids: string[], deleteStatus = 202, lookupStatus = 200) {
  const fetch = vi.fn((_url: string, init?: RequestInit) =>
    Promise.resolve(
      init?.method === "DELETE"
        ? new Response(null, { status: deleteStatus })
        : new Response(JSON.stringify({ results: ids.map((id) => ({ id })) }), {
            status: lookupStatus,
          }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
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

  it("sends the delivery's ids and page path, making none of its own", async () => {
    const fetch = answer();
    await new PosthogAnalyticsDriver(config).send([
      {
        ...delivery("a.one"),
        context: { library: { name: "@stackra/analytics" }, page: { path: "/pricing" } },
      },
      delivery("a.two"),
    ]);
    const [first, second] = request(fetch).body.batch;
    expect(first.properties).toMatchObject({
      distinct_id: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
      $session_id: "ses_01jbadk0g0cccccccccccccccc",
      $insert_id: "evt_01jbadk0g0aaaaaaaaaaaaaaaa",
      $pathname: "/pricing",
    });
    expect(second.properties).not.toHaveProperty("$pathname");
  });

  it("sends an identified visitor's events as the user, with groups and a person profile", async () => {
    const fetch = answer();
    await new PosthogAnalyticsDriver(config).send([
      { ...delivery("a.one"), userId: "usr_1", groups: { scope: "scp_1" } },
    ]);
    expect(request(fetch).body.batch[0].properties).toMatchObject({
      distinct_id: "usr_1",
      $groups: { scope: "scp_1" },
      $process_person_profile: true,
    });
  });

  it("maps identify to $identify and group to $groupidentify", async () => {
    const fetch = answer();
    await new PosthogAnalyticsDriver(config).send([
      { ...delivery("identify"), kind: AnalyticsDeliveryKind.Identify, userId: "usr_1" },
      {
        ...delivery("group", { type: "scope", id: "scp_1" }),
        kind: AnalyticsDeliveryKind.Group,
        userId: "usr_1",
        groups: { scope: "scp_1" },
      },
    ]);
    const [identify, group] = request(fetch).body.batch;
    expect(identify).toMatchObject({
      event: "$identify",
      properties: {
        distinct_id: "usr_1",
        $anon_distinct_id: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
      },
    });
    expect(group).toMatchObject({
      event: "$groupidentify",
      properties: { distinct_id: "usr_1", $group_type: "scope", $group_key: "scp_1" },
    });
    expect(group.properties).not.toHaveProperty("type");
  });

  it("hands a batch to sendBeacon as the same body, and answers whether the browser took it", async () => {
    const beacon = vi.fn((_url: string, _data: Blob) => true);
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    const driver = new PosthogAnalyticsDriver(config);
    expect(driver.beacon([delivery("lead.submitted", { plan: "pro" })])).toBe(true);
    const [url, data] = beacon.mock.calls[0] as [string, Blob];
    expect(url).toBe("https://eu.i.posthog.com/batch/");
    const body = JSON.parse(await data.text());
    expect(body).toMatchObject({ api_key: "phc_test", batch: [{ event: "lead.submitted" }] });
    beacon.mockReturnValueOnce(false);
    expect(driver.beacon([delivery("a.one")])).toBe(false);
  });

  it("answers false to a beacon without sendBeacon or a key", () => {
    vi.stubGlobal("navigator", {});
    expect(new PosthogAnalyticsDriver(config).beacon([delivery("a.one")])).toBe(false);
    vi.stubGlobal("navigator", { sendBeacon: () => true });
    const keyless = buildConfig(AnalyticsConfig, { values: { posthogKey: null } });
    expect(new PosthogAnalyticsDriver(keyless).beacon([delivery("a.one")])).toBe(false);
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

  describe("erasePerson", () => {
    it("finds the subject's persons by distinct id and deletes each with its events", async () => {
      const fetch = persons(["p-1", "p-2"]);
      await expect(new PosthogAnalyticsDriver(eraseConfig).erasePerson("usr_1")).resolves.toBe(2);
      const base = "https://posthog.acme.example/api/projects/42/persons/";
      expect(fetch.mock.calls.map(([url, init]) => [init?.method ?? "GET", url])).toEqual([
        ["GET", `${base}?distinct_id=usr_1`],
        ["DELETE", `${base}p-1/?delete_events=true&delete_recordings=true`],
        ["DELETE", `${base}p-2/?delete_events=true&delete_recordings=true`],
      ]);
      for (const [, init] of fetch.mock.calls)
        expect(init?.headers).toEqual({ authorization: "Bearer phx_test" });
    });

    it("answers 0 when PostHog knows no person, and counts one already deleted", async () => {
      persons([]);
      await expect(new PosthogAnalyticsDriver(eraseConfig).erasePerson("usr_1")).resolves.toBe(0);
      persons(["p-1"], 404);
      await expect(new PosthogAnalyticsDriver(eraseConfig).erasePerson("usr_1")).resolves.toBe(1);
    });

    it("rejects without the personal API key or the project id, before any request", async () => {
      const fetch = persons(["p-1"]);
      await expect(new PosthogAnalyticsDriver(config).erasePerson("usr_1")).rejects.toThrow(
        /ANALYTICS_POSTHOG_PERSONAL_API_KEY/,
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects on an error status", async () => {
      persons([], 202, 401);
      await expect(new PosthogAnalyticsDriver(eraseConfig).erasePerson("usr_1")).rejects.toThrow(
        "HTTP 401",
      );
      persons(["p-1"], 500);
      await expect(new PosthogAnalyticsDriver(eraseConfig).erasePerson("usr_1")).rejects.toThrow(
        "HTTP 500",
      );
    });
  });
});
