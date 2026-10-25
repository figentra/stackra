/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageStaffPinStoreDriver` and `MemoryStaffPinStoreDriver`: each is a `StaffPinStore`; the
 *          storage driver keeps credentials in the `secrets` area with the lockout as an instant, lists a device's
 *          principals, drops an unreadable value, and removes one.
 * Boundary: test only; `@stackra/storage`'s `MemoryStorageDriver`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 8); ADR 0256.
 */
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";

import { StaffPinStore } from "#contracts/index";
import { MemoryStaffPinStoreDriver } from "#core/drivers/memory-staff-pin-store.driver";
import { StorageStaffPinStoreDriver } from "#core/drivers/storage-staff-pin-store.driver";

const TILL = "dev_01j9z3k4m5n6p7q8r9s0t1v2d1";
const CASHIER = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";
const credential = {
  device: TILL,
  principal: CASHIER,
  hash: "h",
  salt: "s",
  iterations: 100_000,
  failures: 2,
  lockedUntil: new Date("2026-10-25T09:15:00Z"),
} as const;

describe("StorageStaffPinStoreDriver", () => {
  it("keeps credentials in the secrets area", async () => {
    const storage = new MemoryStorageDriver();
    const store = new StorageStaffPinStoreDriver(storage);
    expect(store).toBeInstanceOf(StaffPinStore);
    await store.put(credential);
    expect(await store.get(TILL, CASHIER)).toEqual(credential);
    expect(await store.principals(TILL)).toEqual([CASHIER]);
    storage.secrets.set(`identity.staff_pin.${TILL}.usr_x`, { hash: 1 });
    expect(await store.get(TILL, "usr_x")).toBeUndefined();
    expect(await store.principals(TILL)).toEqual([CASHIER]);
    expect(await store.remove(TILL, CASHIER)).toBe(true);
    expect(await store.remove(TILL, CASHIER)).toBe(false);
  });
});

describe("MemoryStaffPinStoreDriver", () => {
  it("keeps, lists and removes credentials", async () => {
    const store = new MemoryStaffPinStoreDriver();
    await store.put(credential);
    expect((await store.get(TILL, CASHIER))?.failures).toBe(2);
    expect(await store.principals(TILL)).toEqual([CASHIER]);
    expect(await store.remove(TILL, CASHIER)).toBe(true);
  });
});
