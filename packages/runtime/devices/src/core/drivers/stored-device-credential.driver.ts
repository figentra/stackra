/**
 * Stackra file contract:
 * Purpose: `StoredDeviceCredentialDriver`, the `DeviceCredential` driver of a paired device app: the access token the
 *          hub handed it at pairing, read from the `secrets` area of `@stackra/storage`; none before pairing.
 * Boundary: reads only `DEVICE_STORAGE_KEYS.token`; never logs or refreshes it. Identity issues and revokes it (ADR
 *           0361 decision 7); a revoked token makes the hub answer 401, which the HTTP drivers turn into
 *           `DeviceUnauthorizedError`, and the app pairs again.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0256 (the `secrets` area).
 */
import { Driver } from "@stackra/container";
import { Storage } from "@stackra/storage/contracts";

import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";

/**
 * The paired device's token, from storage.
 *
 * @example
 * // generated device-app wiring
 * { port: DeviceCredential, candidates: { stored: () => import("@stackra/devices").then((m) => m.StoredDeviceCredentialDriver) } }
 */
export class StoredDeviceCredentialDriver extends Driver(DeviceCredential) {
  /** The device app's storage. */
  private readonly storage: Storage;

  /** @param storage - the device app's storage. */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /** The stored token, or `undefined` before pairing. */
  async token(): Promise<string | undefined> {
    const stored = this.storage.secrets.get(DEVICE_STORAGE_KEYS.token);
    return typeof stored === "string" && stored !== "" ? stored : undefined;
  }
}
