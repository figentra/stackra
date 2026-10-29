/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoLiveActivitiesDriver`: on iOS a show starts the `OrderProgress` activity with its deep
 *          link and then updates it, also after a relaunch through the id kept in storage; an end dismisses it after
 *          the configured delay; push tokens come from the running activity and the push-to-start listener; a refused
 *          start resolves `unavailable`; Android posts and replaces an ongoing notification per reference, and refuses
 *          when its channel is missing or the post fails.
 * Boundary: test only; react-native, expo-notifications, expo-widgets and Expo UI are mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 3); STA-1539.
 */
import { buildConfig } from "@stackra/config";
import { fakeStorage } from "@stackra/storage/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LiveActivityConfig } from "#config/live-activity.config";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { ExpoLiveActivitiesDriver } from "#native/drivers/expo-live-activities.driver";

const mocks = vi.hoisted(() => {
  const instance = {
    getId: vi.fn(() => "activity_1"),
    update: vi.fn(async () => undefined),
    end: vi.fn(async () => undefined),
    getPushToken: vi.fn(async (): Promise<string | null> => "apns_token"),
  };
  const instances: (typeof instance)[] = [];
  const remove = vi.fn();
  return {
    os: { OS: "ios" },
    instance,
    instances,
    start: vi.fn((_props: unknown, _url?: string) => {
      instances.push(instance);
      return instance;
    }),
    after: vi.fn((date: Date) => ({ after: date })),
    remove,
    pushToStart: vi.fn((_listener: (event: { activityPushToStartToken: string }) => void) => ({
      remove,
    })),
    permission: { granted: true, status: "granted" },
    schedule: vi.fn(async () => "id"),
    dismiss: vi.fn(async () => undefined),
    channel: vi.fn(async (): Promise<object | null> => ({ id: "live_activity" })),
  };
});

vi.mock("react-native", () => ({ Platform: mocks.os }));
vi.mock("@expo/ui/swift-ui", () => ({ HStack: () => null, Text: () => null, VStack: () => null }));
vi.mock("expo-widgets", () => ({
  after: mocks.after,
  addPushToStartTokenListener: mocks.pushToStart,
  createLiveActivity: () => ({ start: mocks.start, getInstances: () => mocks.instances }),
}));
vi.mock("expo-notifications", () => ({
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  getPermissionsAsync: async () => mocks.permission,
  scheduleNotificationAsync: mocks.schedule,
  dismissNotificationAsync: mocks.dismiss,
  getNotificationChannelAsync: mocks.channel,
}));

const ORDER: ActivityProgress = {
  reference: "order_1042",
  title: "Order 1042",
  status: "Being prepared",
  step: 1,
  steps: 4,
  url: "app://orders/1042",
};

/** A driver over the default configuration and `storage`. */
function driver(storage = fakeStorage()): ExpoLiveActivitiesDriver {
  return new ExpoLiveActivitiesDriver(buildConfig(LiveActivityConfig), storage);
}

describe("ExpoLiveActivitiesDriver", () => {
  beforeEach(() => {
    mocks.os.OS = "ios";
    mocks.instances.length = 0;
    mocks.permission.granted = true;
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

  it("updates an activity started before a relaunch instead of starting another", async () => {
    const storage = fakeStorage();
    await driver(storage).show(ORDER);
    await driver(storage).show({ ...ORDER, step: 3 });
    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.instance.update).toHaveBeenCalledOnce();
  });

  it("starts again once the OS has ended the kept activity", async () => {
    const storage = fakeStorage();
    await driver(storage).show(ORDER);
    mocks.instances.length = 0;
    await driver(storage).show(ORDER);
    expect(mocks.start).toHaveBeenCalledTimes(2);
  });

  it("ends a running activity after the configured dismissal, and ignores an unknown one", async () => {
    const activities = driver();
    await activities.show(ORDER);
    const before = Date.now();
    await activities.end("order_1042", { ...ORDER, step: 4 });
    await activities.end("order_1042");
    expect(mocks.instance.end).toHaveBeenCalledOnce();
    const { url: _url, ...props } = ORDER;
    expect(mocks.instance.end.mock.calls[0]?.[1]).toEqual({ ...props, step: 4 });
    const until = mocks.after.mock.calls[0]?.[0].getTime() ?? 0;
    expect(until - before).toBeGreaterThanOrEqual(900_000);
  });

  it("answers the running activity's push token and listens for push-to-start tokens", async () => {
    const activities = driver();
    expect(await activities.pushToken("order_1042")).toBeNull();
    await activities.show(ORDER);
    expect(await activities.pushToken("order_1042")).toBe("apns_token");
    const tokens: string[] = [];
    const stop = activities.onPushToStartToken((token) => tokens.push(token));
    mocks.pushToStart.mock.calls[0]?.[0]({ activityPushToStartToken: "start_token" });
    stop();
    expect(tokens).toEqual(["start_token"]);
    expect(mocks.remove).toHaveBeenCalledOnce();
  });

  it("refuses when the OS refuses the start", async () => {
    mocks.start.mockImplementationOnce(() => {
      throw new Error("Live Activities are disabled");
    });
    expect(await driver().show(ORDER)).toMatchObject({ ok: false, error: { code: "unavailable" } });
  });

  it("posts an ongoing notification on Android, replaced per reference, and ends it", async () => {
    mocks.os.OS = "android";
    const activities = driver();
    expect(await activities.show(ORDER)).toEqual({ ok: true, data: undefined });
    expect(mocks.schedule).toHaveBeenCalledWith({
      identifier: "order_1042",
      content: {
        title: "Order 1042",
        body: "Being prepared · 1/4",
        data: { url: "app://orders/1042" },
        sticky: true,
        autoDismiss: false,
      },
      trigger: { channelId: "live_activity" },
    });
    await activities.end("order_1042", { ...ORDER, step: 4, status: "Delivered" });
    expect(mocks.schedule).toHaveBeenLastCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ sticky: false, autoDismiss: true }),
      }),
    );
    await activities.end("order_1042");
    expect(mocks.dismiss).toHaveBeenCalledWith("order_1042");
    expect(await activities.pushToken("order_1042")).toBeNull();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("refuses on Android without the notification permission", async () => {
    mocks.os.OS = "android";
    mocks.permission.granted = false;
    expect(await driver().show(ORDER)).toMatchObject({
      ok: false,
      error: { code: "permission_denied" },
    });
  });

  it("refuses on Android when the channel was never created or the post fails", async () => {
    mocks.os.OS = "android";
    mocks.channel.mockResolvedValueOnce(null);
    expect(await driver().show(ORDER)).toMatchObject({ ok: false, error: { code: "unavailable" } });
    expect(mocks.schedule).not.toHaveBeenCalled();
    mocks.schedule.mockRejectedValueOnce(new Error("native failure"));
    expect(await driver().show(ORDER)).toMatchObject({ ok: false, error: { code: "unavailable" } });
    mocks.dismiss.mockRejectedValueOnce(new Error("native failure"));
    await expect(driver().end("order_1042")).resolves.toBeUndefined();
  });
});
