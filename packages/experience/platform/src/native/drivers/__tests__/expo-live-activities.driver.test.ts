/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoLiveActivitiesDriver`: on iOS a show starts the `OrderProgress` activity with its deep
 *          link and then updates it, an end dismisses it after the configured delay, and Android or a refused start
 *          resolve `unavailable`.
 * Boundary: test only; react-native, expo-widgets and Expo UI are mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 3); STA-1539.
 */
import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LiveActivityConfig } from "#config/live-activity.config";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { ExpoLiveActivitiesDriver } from "#native/drivers/expo-live-activities.driver";

const mocks = vi.hoisted(() => {
  const instance = { update: vi.fn(async () => undefined), end: vi.fn(async () => undefined) };
  return {
    os: { OS: "ios" },
    instance,
    start: vi.fn((_props: unknown, _url?: string) => instance),
    after: vi.fn((date: Date) => ({ after: date })),
  };
});

vi.mock("react-native", () => ({ Platform: mocks.os }));
vi.mock("@expo/ui/swift-ui", () => ({ HStack: () => null, Text: () => null, VStack: () => null }));
vi.mock("expo-widgets", () => ({
  after: mocks.after,
  createLiveActivity: () => ({ start: mocks.start }),
}));

const ORDER: ActivityProgress = {
  reference: "order_1042",
  title: "Order 1042",
  status: "Being prepared",
  step: 1,
  steps: 4,
  url: "app://orders/1042",
};

/** A driver over the default configuration. */
function driver(): ExpoLiveActivitiesDriver {
  return new ExpoLiveActivitiesDriver(buildConfig(LiveActivityConfig));
}

describe("ExpoLiveActivitiesDriver", () => {
  beforeEach(() => {
    mocks.os.OS = "ios";
    vi.clearAllMocks();
  });

  it("starts once with the deep link, then updates", async () => {
    const activities = driver();
    expect(await activities.show(ORDER)).toEqual({ ok: true, data: undefined });
    await activities.show({ ...ORDER, step: 2 });
    const { url: _url, ...props } = ORDER;
    expect(mocks.start).toHaveBeenCalledExactlyOnceWith(props, "app://orders/1042");
    expect(mocks.instance.update).toHaveBeenCalledWith({ ...props, step: 2 });
  });

  it("ends a running activity after the configured dismissal, and ignores an unknown one", async () => {
    const activities = driver();
    await activities.show(ORDER);
    const before = Date.now();
    await activities.end("order_1042", { ...ORDER, step: 4 });
    await activities.end("order_1042");
    expect(mocks.instance.end).toHaveBeenCalledOnce();
    const until = mocks.after.mock.calls[0]?.[0].getTime() ?? 0;
    expect(until - before).toBeGreaterThanOrEqual(900_000);
  });

  it("refuses on Android and when the OS refuses the start", async () => {
    mocks.os.OS = "android";
    expect(await driver().show(ORDER)).toMatchObject({ ok: false, error: { code: "unavailable" } });
    mocks.os.OS = "ios";
    mocks.start.mockImplementationOnce(() => {
      throw new Error("Live Activities are disabled");
    });
    expect(await driver().show(ORDER)).toMatchObject({ ok: false, error: { code: "unavailable" } });
  });
});
