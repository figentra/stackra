/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDeviceSequenceStoreDriver`: an unknown device has no sequence, `settle` advances only
 *          to the next sequence (a repeat or a jump changes nothing), and the settled call's scope is kept per device.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338 (decisions 1 and 4).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeviceSequenceStore } from "#contracts/index";
import { MemoryDeviceSequenceStoreDriver } from "#core/drivers/memory-device-sequence-store.driver";

const AT = new Date("2026-10-25T09:00:00.000Z");
const SHOP: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme.shop_eu" };

describe("MemoryDeviceSequenceStoreDriver", () => {
  it("is a DeviceSequenceStore", () => {
    expect(new MemoryDeviceSequenceStoreDriver()).toBeInstanceOf(DeviceSequenceStore);
  });

  it("advances one sequence at a time and keeps the scope", async () => {
    const store = new MemoryDeviceSequenceStoreDriver();
    expect(await store.last("dev_1")).toBeUndefined();
    await store.settle("dev_1", 2, AT, SHOP);
    expect(await store.last("dev_1")).toBeUndefined();
    await store.settle("dev_1", 1, AT, SHOP);
    await store.settle("dev_1", 1, AT, undefined);
    expect(await store.last("dev_1")).toEqual({
      deviceId: "dev_1",
      sequence: 1,
      settledAt: AT,
      scope: SHOP,
    });
    await store.settle("dev_1", 2, AT, undefined);
    expect(await store.last("dev_1")).toEqual({ deviceId: "dev_1", sequence: 2, settledAt: AT });
    expect(await store.last("dev_2")).toBeUndefined();
  });
});
