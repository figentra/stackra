/**
 * Stackra file contract:
 * Purpose: unit tests of `StoredDeviceCredentialDriver`: no token before pairing, the stored token after.
 * Boundary: test only; the storage is @stackra/storage's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0361 (decision 7).
 */
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";

import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";
import { StoredDeviceCredentialDriver } from "#core/drivers/stored-device-credential.driver";

describe("StoredDeviceCredentialDriver", () => {
  it("answers the token kept at pairing, none before", async () => {
    const storage = new MemoryStorageDriver();
    const credential = new StoredDeviceCredentialDriver(storage);
    expect(credential).toBeInstanceOf(DeviceCredential);
    expect(await credential.token()).toBeUndefined();
    storage.secrets.set(DEVICE_STORAGE_KEYS.token, "device-token");
    expect(await credential.token()).toBe("device-token");
  });
});
