/**
 * Stackra file contract:
 * Purpose: unit tests of `createNotificationChannels`: each configured channel is created with its translated name,
 *          its importance, vibration and sound.
 * Boundary: test only; expo-notifications is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3, 2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { NotificationImportance } from "#core/enums/notification-importance.enum";
import { createNotificationChannels } from "#native/functions/create-notification-channels.function";

const mocks = vi.hoisted(() => ({ setNotificationChannelAsync: vi.fn(async () => null) }));

vi.mock("expo-notifications", () => ({
  setNotificationChannelAsync: mocks.setNotificationChannelAsync,
  AndroidImportance: { MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
}));

describe("createNotificationChannels", () => {
  it("creates each channel named in the phone's language", async () => {
    await createNotificationChannels(
      [
        {
          id: "transactional",
          nameKey: "app::push.transactional",
          importance: NotificationImportance.High,
          vibrate: true,
          sound: "default",
        },
        {
          id: "marketing",
          nameKey: "app::push.marketing",
          importance: NotificationImportance.Low,
          vibrate: false,
          sound: null,
        },
      ],
      (key) => `t(${key})`,
    );
    expect(mocks.setNotificationChannelAsync.mock.calls).toEqual([
      [
        "transactional",
        {
          name: "t(app::push.transactional)",
          importance: 4,
          enableVibrate: true,
          sound: "default",
        },
      ],
      [
        "marketing",
        { name: "t(app::push.marketing)", importance: 2, enableVibrate: false, sound: null },
      ],
    ]);
  });
});
