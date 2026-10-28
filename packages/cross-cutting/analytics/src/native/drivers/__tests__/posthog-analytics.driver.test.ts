/**
 * Stackra file contract:
 * Purpose: unit tests of the native `posthog` `AnalyticsDriver`: a subclass of the core driver that buffers, sends one
 *          batch at 20 events, sends what waits when `AppState` goes to `background` (not on other states), and keeps
 *          a failed batch for the next flush.
 * Boundary: test only. React Native does not load in vitest, so `react-native` is replaced by an `AppState` whose
 *           listener the test calls; `fetch` is stubbed, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298.
 */
import { buildConfig } from "@stackra/config";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { PosthogAnalyticsDriver as CorePosthogAnalyticsDriver } from "#core/drivers/posthog-analytics.driver";
import { PosthogAnalyticsDriver } from "#native/drivers/posthog-analytics.driver";

const appState = vi.hoisted(() => ({ listeners: [] as ((state: string) => void)[] }));

vi.mock("react-native", () => ({
  AppState: {
    addEventListener: (_type: string, listener: (state: string) => void) => {
      appState.listeners.push(listener);
      return { remove: () => undefined };
    },
  },
}));

const config = buildConfig(AnalyticsConfig, {
  values: { driver: "posthog", posthogKey: "phc_test" },
});

/** `count` deliveries named `e.<n>`. */
const deliveries = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => ({
    name: `e.${from + index}`,
    properties: {},
    occurredAt: "2026-10-25T09:00:00.000Z",
  }));

/** Stubs `fetch` with one status and returns the spy. */
function answer(status = 200) {
  const fetch = vi.fn(() => Promise.resolve(new Response("{}", { status })));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The event names of the `index`th request. */
function sent(fetch: ReturnType<typeof answer>, index = 0): string[] {
  const [, init] = fetch.mock.calls[index] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body)).batch.map((event: { event: string }) => event.event);
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

describe("native PosthogAnalyticsDriver", () => {
  it("extends the core PostHog driver", () => {
    expect(new PosthogAnalyticsDriver(config)).toBeInstanceOf(CorePosthogAnalyticsDriver);
  });

  it("buffers below 20 events and sends them as one batch at 20", async () => {
    const fetch = answer();
    const driver = new PosthogAnalyticsDriver(config);
    await driver.send(deliveries(19));
    expect(fetch).not.toHaveBeenCalled();
    await driver.send(deliveries(1, 19));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sent(fetch)).toHaveLength(20);
    expect(sent(fetch)[19]).toBe("e.19");
  });

  it("sends what waits when the app goes to the background, and only then", async () => {
    const fetch = answer();
    const driver = new PosthogAnalyticsDriver(config);
    await driver.send(deliveries(2));
    await moveTo("inactive");
    expect(fetch).not.toHaveBeenCalled();
    await moveTo("background");
    expect(sent(fetch)).toEqual(["e.0", "e.1"]);
    await moveTo("background");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps a failed batch, in order, for the next flush", async () => {
    answer(503);
    const driver = new PosthogAnalyticsDriver(config);
    await driver.send(deliveries(2));
    await moveTo("background");
    const fetch = answer();
    await driver.send(deliveries(1, 2));
    await moveTo("background");
    expect(sent(fetch)).toEqual(["e.0", "e.1", "e.2"]);
  });

  it("still posts a batch when the runtime has no global crypto", async () => {
    const fetch = answer();
    vi.stubGlobal("crypto", undefined);
    const driver = new PosthogAnalyticsDriver(config);
    await driver.send(deliveries(20));
    expect(fetch).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
