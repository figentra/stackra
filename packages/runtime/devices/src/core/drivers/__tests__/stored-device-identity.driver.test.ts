/**
 * Stackra file contract:
 * Purpose: unit tests of `StoredDeviceIdentityDriver`: it mints the install id once, keeps it in `prefs`, answers the
 *          same id on every call, and replaces a stored value that is not a string.
 * Boundary: test only; the storage is @stackra/storage's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 1); ADR 0361 (decision 7).
 */
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";

import { DeviceIdentity } from "#contracts/ports/device-identity.port";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";
import { StoredDeviceIdentityDriver } from "#core/drivers/stored-device-identity.driver";

describe("StoredDeviceIdentityDriver", () => {
  it("mints the install id once and keeps it", async () => {
    const storage = new MemoryStorageDriver();
    const identity = new StoredDeviceIdentityDriver(storage);
    expect(identity).toBeInstanceOf(DeviceIdentity);
    const id = await identity.id();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await identity.id()).toBe(id);
    expect(await new StoredDeviceIdentityDriver(storage).id()).toBe(id);
    expect(storage.prefs.get(DEVICE_STORAGE_KEYS.deviceId)).toBe(id);
  });

  it("replaces a stored value that is not an id", async () => {
    const storage = new MemoryStorageDriver();
    storage.prefs.set(DEVICE_STORAGE_KEYS.deviceId, 42);
    expect(await new StoredDeviceIdentityDriver(storage).id()).toMatch(/^[0-9a-f-]{36}$/);
  });
});
