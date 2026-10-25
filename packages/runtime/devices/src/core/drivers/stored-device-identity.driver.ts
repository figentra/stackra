/**
 * Stackra file contract:
 * Purpose: `StoredDeviceIdentityDriver`, the `DeviceIdentity` driver of a device app: the install id, minted once with
 *          `crypto.randomUUID` and kept in the `prefs` area of `@stackra/storage`, the same id the device pairs under,
 *          so it never changes while the install lives (ADR 0338 decision 1).
 * Boundary: reads and writes only `DEVICE_STORAGE_KEYS.deviceId`; a stored value that is not a non-empty string is
 *           replaced by a fresh id. The write is flushed by the storage driver, as every prefs write is.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: device identity in @stackra/devices); ADR 0338 (decision 1); ADR 0256.
 */
import { Driver } from "@stackra/container";
import { Storage } from "@stackra/storage/contracts";

import { DeviceIdentity } from "#contracts/ports/device-identity.port";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";

/**
 * This install's id, from storage.
 *
 * @example
 * // generated device-app wiring
 * { port: DeviceIdentity, candidates: { stored: () => import("@stackra/devices").then((m) => m.StoredDeviceIdentityDriver) } }
 */
export class StoredDeviceIdentityDriver extends Driver(DeviceIdentity) {
  /** The device app's storage. */
  private readonly storage: Storage;

  /** @param storage - the device app's storage. */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /** The install id, minted on the first call. */
  async id(): Promise<string> {
    const stored = this.storage.prefs.get(DEVICE_STORAGE_KEYS.deviceId);
    if (typeof stored === "string" && stored !== "") return stored;
    const minted = globalThis.crypto.randomUUID();
    this.storage.prefs.set(DEVICE_STORAGE_KEYS.deviceId, minted);
    return minted;
  }
}
