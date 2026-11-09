/**
 * Stackra file contract:
 * Purpose: unit tests of the native `relay` `AnalyticsDriver` (STA-1624): a subclass of the core relay that buffers,
 *          sends one batch at 20 events and on `background`, keeps a failed batch for the next flush, and stamps the
 *          coarse `context.device` without replacing one the delivery already carries.
 * Boundary: test only. React Native does not load in vitest, so `react-native` is replaced by an `AppState` whose
 *           listener the test calls and a fixed `Platform`; `fetch` is stubbed, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0483 (decisions 1 and 6).
 */
import { buildConfig } from "@stackra/config";
import { ConsentConfig, ConsentLedger, MemoryConsentStoreDriver } from "@stackra/consent";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { RelayAnalyticsDriver as CoreRelayAnalyticsDriver } from "#core/drivers/relay-analytics.driver";
import { RelayAnalyticsDriver } from "#native/drivers/relay-analytics.driver";

const appState = vi.hoisted(() => ({ listeners: [] as ((state: string) => void)[] }));

vi.mock("react-native", () => ({
  AppState: {
    addEventListener: (_type: string, listener: (state: string) => void) => {
      appState.listeners.push(listener);
      return { remove: () => undefined };
    },
  },
  Platform: { OS: "ios", Version: "18.0" },
}));

/** A native relay over a fresh ledger. */
function relay() {
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  const config = buildConfig(AnalyticsConfig, {
    values: { driver: "relay", ingestOrigin: "https://api.example.com" },
  });
  return new RelayAnalyticsDriver(config, ledger);
}

/** `count` deliveries named `e.<n>`. */
const deliveries = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => ({
    eventId: `evt_01jbadk0g0aaaaaaaaaaaaaa${String(from + index).padStart(2, "0")}`,
    anonymousId: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
    sessionId: "ses_01jbadk0g0cccccccccccccccc",
    context: { library: { name: "@stackra/analytics" } },
    name: `e.${from + index}`,
    properties: {},
    occurredAt: "2026-10-30T09:00:00.000Z",
  }));

/** Stubs `fetch`: the ingest path answers `status`, the consent endpoint a token. */
function answer(status = 200) {
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/public/consent/snapshots")
        ? new Response(JSON.stringify({ token: "t", expiresAt: "2999-01-01T00:00:00.000Z" }))
        : new Response("{}", { status }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The deliveries of every ingest request, in order. */
function batches(fetch: ReturnType<typeof answer>) {
  return (fetch.mock.calls as unknown as [string, RequestInit][])
    .filter(([url]) => url.endsWith("/public/analytics/batches"))
    .map(
      ([, init]) =>
        JSON.parse(String(init.body)).deliveries as {
          name: string;
          context: { device?: unknown };
        }[],
    );
}

/** Moves the app to `state`, as React Native would, and lets the flush settle. */
async function moveTo(state: string): Promise<void> {
  for (const listener of appState.listeners) listener(state);
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

beforeEach(() => {
  appState.listeners.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("native RelayAnalyticsDriver", () => {
  it("extends the core relay driver", () => {
    expect(relay()).toBeInstanceOf(CoreRelayAnalyticsDriver);
  });

  // @covers sta-1624:FR-002
  it("buffers below 20 events and sends them as one batch at 20", async () => {
    const fetch = answer();
    const driver = relay();
    await driver.send(deliveries(19));
    expect(batches(fetch)).toHaveLength(0);
    await driver.send(deliveries(1, 19));
    expect(batches(fetch)).toHaveLength(1);
    expect(batches(fetch)[0]).toHaveLength(20);
  });

  // @covers sta-1624:FR-002
  it("sends what waits on background and keeps a failed batch for the next flush", async () => {
    answer(503);
    const driver = relay();
    await driver.send(deliveries(2));
    await moveTo("background");
    const fetch = answer();
    await driver.send(deliveries(1, 2));
    await moveTo("inactive");
    expect(batches(fetch)).toHaveLength(0);
    await moveTo("background");
    expect(batches(fetch)[0]?.map((item) => item.name)).toEqual(["e.0", "e.1", "e.2"]);
  });

  // @covers sta-1624:FR-003
  it("stamps the coarse device and keeps one already set", async () => {
    const fetch = answer();
    const driver = relay();
    const own = { os: "android", osVersion: "15" };
    const withOwn = deliveries(1, 1).map((item) => ({
      ...item,
      context: { ...item.context, device: own },
    }));
    await driver.send([...deliveries(1), ...withOwn]);
    await moveTo("background");
    expect(batches(fetch)[0]?.map((item) => item.context.device)).toEqual([
      { os: "ios", osVersion: "18.0" },
      own,
    ]);
  });
});
