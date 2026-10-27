/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPreferenceStoreDriver`: a `PreferenceStore` driver that records a choice per recipient,
 *          category and channel, answers by the category's opt-in rule when none is recorded, and never lets a
 *          mandatory (config) or transactional category be turned off.
 * Boundary: test only; the configuration is a plain stand-in with the one field the driver reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ACA-539; stackra-218 (STA-1376).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { NotificationsConfig } from "#config/notifications.config";
import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { PreferenceStore } from "#contracts/ports/preference-store.port";
import { MemoryPreferenceStoreDriver } from "#core/drivers/memory-preference-store.driver";

const ALICE: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const BOB: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";
const CONFIG = { mandatoryCategories: ["pickup"] } as unknown as NotificationsConfig;

describe("MemoryPreferenceStoreDriver", () => {
  it("is a PreferenceStore", () => {
    expect(new MemoryPreferenceStoreDriver()).toBeInstanceOf(PreferenceStore);
  });

  it("answers by the opt-in rule until a choice is recorded, per recipient and channel", async () => {
    const store = new MemoryPreferenceStoreDriver(CONFIG);
    await expect(store.allows(ALICE, "marketing", NotificationChannel.Mail)).resolves.toBe(false);
    await expect(store.set(ALICE, "marketing", NotificationChannel.Mail, true)).resolves.toBe(true);
    await expect(store.allows(ALICE, "marketing", NotificationChannel.Mail)).resolves.toBe(true);
    await expect(store.allows(ALICE, "marketing", NotificationChannel.Sms)).resolves.toBe(false);
    await expect(store.allows(BOB, "marketing", NotificationChannel.Mail)).resolves.toBe(false);
    await store.set(ALICE, "activity", NotificationChannel.Mail, false);
    await expect(store.allows(ALICE, "activity", NotificationChannel.Mail)).resolves.toBe(false);
  });

  it("never turns off a mandatory or transactional category", async () => {
    const store = new MemoryPreferenceStoreDriver(CONFIG);
    await expect(store.set(ALICE, "pickup", NotificationChannel.Sms, false)).resolves.toBe(false);
    await expect(store.allows(ALICE, "pickup", NotificationChannel.Sms)).resolves.toBe(true);
    await expect(store.set(ALICE, "transactional", NotificationChannel.Mail, false)).resolves.toBe(
      false,
    );
    await expect(store.allows(ALICE, "transactional", NotificationChannel.Mail)).resolves.toBe(
      true,
    );
  });
});
