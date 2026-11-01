/**
 * Stackra file contract:
 * Purpose: unit tests of the `relay` `AnalyticsDriver` (STA-1624): one request per send to the ingest path of the
 *          ingest origin, the deliveries unchanged in the body, the `Stackra-Consent` header of a snapshot asked for the
 *          batch's anonymous id, no vendor key anywhere, no request for an empty list, no header when the consent
 *          endpoint fails, no beacon, and the errors for a missing origin and an error status.
 * Boundary: test only; `fetch` is stubbed and routed by path, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0483 (decisions 1 and 2); ADR 0472.
 */
import { buildConfig } from "@stackra/config";
import { ConsentConfig, ConsentLedger, MemoryConsentStoreDriver } from "@stackra/consent";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { RelayAnalyticsDriver } from "#core/drivers/relay-analytics.driver";

const ORIGIN = "https://api.example.com";

/** A relay over a fresh ledger, sending to `ingestOrigin`. */
function relay(ingestOrigin = `${ORIGIN}/`) {
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  const config = buildConfig(AnalyticsConfig, { values: { driver: "relay", ingestOrigin } });
  return new RelayAnalyticsDriver(config, ledger);
}

/** A delivery named `name`. */
const delivery = (name: string) => ({
  eventId: "evt_01jbadk0g0aaaaaaaaaaaaaaaa",
  anonymousId: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
  sessionId: "ses_01jbadk0g0cccccccccccccccc",
  context: { library: { name: "@stackra/analytics" } },
  name,
  properties: { plan: "pro" },
  occurredAt: "2026-10-30T09:00:00.000Z",
});

/** Stubs `fetch`: the consent endpoint answers `snapshot` status, the ingest path `ingest` status. */
function answer(ingest = 200, snapshot = 200) {
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/consent/snapshots")
        ? new Response(
            JSON.stringify({ token: "csn.token", expiresAt: "2999-01-01T00:00:00.000Z" }),
            { status: snapshot },
          )
        : new Response("{}", { status: ingest }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The calls `fetch` received for `path`. */
function calls(fetch: ReturnType<typeof answer>, path: string) {
  return (fetch.mock.calls as unknown as [string, RequestInit][]).filter(([url]) =>
    url.endsWith(path),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RelayAnalyticsDriver", () => {
  it("is a driver of the AnalyticsDriver port", () => {
    expect(kindOf(RelayAnalyticsDriver)?.kind).toBe("driver");
    expect(relay()).toBeInstanceOf(AnalyticsDriver);
  });

  // @covers sta-1624:FR-001
  it("posts the deliveries unchanged to the ingest path with the consent header", async () => {
    const fetch = answer();
    const deliveries = [delivery("screen.viewed"), delivery("lead.submitted")];
    await relay().send(deliveries);
    const [[url, init]] = calls(fetch, "/analytics/batches");
    expect(url).toBe(`${ORIGIN}/analytics/batches`);
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.headers).toMatchObject({ "Stackra-Consent": "csn.token" });
    expect(JSON.parse(String(init.body))).toEqual({ deliveries });
  });

  // @covers sta-1624:FR-001
  it("asks the snapshot for the batch's anonymous id, once while the decision holds", async () => {
    const fetch = answer();
    const driver = relay();
    await driver.send([delivery("a")]);
    await driver.send([delivery("b")]);
    const snapshots = calls(fetch, "/consent/snapshots");
    expect(snapshots).toHaveLength(1);
    expect(JSON.parse(String(snapshots[0]?.[1].body)).subject).toBe(
      "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
    );
  });

  // @covers sta-1624:FR-001
  it("sends no vendor key or vendor host", async () => {
    const fetch = answer();
    await relay().send([delivery("a")]);
    for (const [url, init] of fetch.mock.calls as unknown as [string, RequestInit][]) {
      expect(url.startsWith(ORIGIN)).toBe(true);
      expect(String(init.body)).not.toContain("api_key");
    }
  });

  it("still posts, without the header, when the consent endpoint fails", async () => {
    const fetch = answer(200, 503);
    await relay().send([delivery("a")]);
    const [[, init]] = calls(fetch, "/analytics/batches");
    expect(init.headers).not.toHaveProperty("Stackra-Consent");
  });

  it("requests nothing for an empty list and has no beacon", async () => {
    const fetch = answer();
    const driver = relay();
    await driver.send([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(driver.beacon([delivery("a")])).toBe(false);
  });

  it("rejects without an ingest origin and on an error status", async () => {
    answer(503);
    await expect(relay("").send([delivery("a")])).rejects.toThrow(/ingestOrigin is not set/);
    await expect(relay().send([delivery("a")])).rejects.toThrow(/HTTP 503/);
  });
});
