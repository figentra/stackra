/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryOfflineCapStoreDriver`: usage counts and sums one device's calls of one action at or
 *          after `since`, other devices and actions apart, and older calls stop counting.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { OfflineCapStore } from "#contracts/index";
import { MemoryOfflineCapStoreDriver } from "#core/drivers/memory-offline-cap-store.driver";

const KEY = "gift_cards.gift_card.redeem@1";

describe("MemoryOfflineCapStoreDriver", () => {
  it("is an OfflineCapStore", () => {
    expect(new MemoryOfflineCapStoreDriver()).toBeInstanceOf(OfflineCapStore);
  });

  it("counts a device's calls of an action within the window", async () => {
    const store = new MemoryOfflineCapStoreDriver();
    await store.record("dev_1", KEY, new Date("2026-10-24T08:00:00Z"), 1_000);
    await store.record("dev_1", KEY, new Date("2026-10-25T08:00:00Z"), 2_500);
    await store.record("dev_2", KEY, new Date("2026-10-25T08:00:00Z"), 9_000);
    await store.record("dev_1", "sales.sale.refund@1", new Date("2026-10-25T08:00:00Z"), 700);
    expect(await store.usage("dev_1", KEY, new Date("2026-10-24T00:00:00Z"))).toEqual({
      count: 2,
      amount: 3_500,
    });
    expect(await store.usage("dev_1", KEY, new Date("2026-10-25T00:00:00Z"))).toEqual({
      count: 1,
      amount: 2_500,
    });
    expect(await store.usage("dev_3", KEY, new Date(0))).toEqual({ count: 0, amount: 0 });
  });
});
