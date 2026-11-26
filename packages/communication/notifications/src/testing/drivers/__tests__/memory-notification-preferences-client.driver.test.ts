/**
 * Stackra file contract:
 * Purpose: proves `MemoryNotificationPreferencesClientDriver` is a `NotificationPreferencesClient`, answers each
 *          scope's seeded rows, applies a `set` and records it, and rejects a locked or unknown channel without
 *          changing anything.
 * Boundary: unit tier; the driver alone.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0263.
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { NotificationPreferencesClient } from "#contracts/ports/notification-preferences-client.port";
import type { NotificationPreferenceRow } from "#contracts/types/notification-preference-row.type";
import { MemoryNotificationPreferencesClientDriver } from "#testing/drivers/memory-notification-preferences-client.driver";

const ROWS: readonly NotificationPreferenceRow[] = [
  {
    topic: "orders",
    label: "Order updates",
    channels: {
      mail: { isEnabled: true, isLocked: false },
      push: { isEnabled: false, isLocked: false },
    },
  },
  {
    topic: "security",
    label: "Security",
    channels: { mail: { isEnabled: true, isLocked: true } },
  },
];

describe("MemoryNotificationPreferencesClientDriver", () => {
  it("is a NotificationPreferencesClient and answers each scope's rows", async () => {
    const client = new MemoryNotificationPreferencesClientDriver().seed("user", ROWS);
    expect(client).toBeInstanceOf(NotificationPreferencesClient);
    expect(await client.get("user")).toEqual(ROWS);
    expect(await client.get("tenant")).toEqual([]);
  });

  it("applies a set and records it", async () => {
    const client = new MemoryNotificationPreferencesClientDriver().seed("user", ROWS);
    const changes = [{ topic: "orders", channel: NotificationChannel.Push, isEnabled: true }];
    await client.set("user", changes);
    const [orders] = await client.get("user");
    expect(orders?.channels.push).toEqual({ isEnabled: true, isLocked: false });
    expect(client.saves).toEqual([{ scope: "user", changes }]);
  });

  it("rejects a locked or unknown channel and changes nothing", async () => {
    const client = new MemoryNotificationPreferencesClientDriver().seed("user", ROWS);
    await expect(
      client.set("user", [
        { topic: "orders", channel: NotificationChannel.Push, isEnabled: true },
        { topic: "security", channel: NotificationChannel.Mail, isEnabled: false },
      ]),
    ).rejects.toThrow(/locked/);
    await expect(
      client.set("user", [{ topic: "orders", channel: NotificationChannel.Sms, isEnabled: true }]),
    ).rejects.toThrow();
    expect(await client.get("user")).toEqual(ROWS);
    expect(client.saves).toEqual([]);
  });
});
