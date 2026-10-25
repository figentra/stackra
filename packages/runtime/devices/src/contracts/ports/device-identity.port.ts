/**
 * Stackra file contract:
 * Purpose: the `DeviceIdentity` port: this device's id, the one every queued call of the offline queue carries so the
 *          server applies the device's calls in order (ADR 0338 decision 1).
 * Boundary: an abstract class that is its own token, keyed `devices.DeviceIdentity`. Identity binds its driver (the
 *           device's registered principal, else a stable id minted once per install); the id never changes while the
 *           install lives, so a revoked device's last acknowledged sequence can be listed by it. Never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 1: devices are principals); ADR 0338 (decision 1); ADR 0294 (decisions 15 and
 *                     16).
 */
import { Port } from "@stackra/contracts";

/**
 * Answers this device's id.
 *
 * @example
 * export class StoredDeviceIdentityDriver extends Driver(DeviceIdentity) {
 *   id(): Promise<string> {
 *     return Promise.resolve(this.storage.prefs.get("identity.device_id") as string);
 *   }
 * }
 */
export abstract class DeviceIdentity extends Port {
  /** Type-only port key, so `DriverName<DeviceIdentity>` narrows to this port's drivers. */
  declare readonly "~key": "devices.DeviceIdentity";

  /** This device's id; the same on every call while the install lives. */
  abstract id(): Promise<string>;
}
