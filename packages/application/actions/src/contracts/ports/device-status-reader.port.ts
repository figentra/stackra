/**
 * Stackra file contract:
 * Purpose: the `DeviceStatusReader` port: whether a device is revoked, so the pipeline refuses a revoked device's calls
 *          itself rather than relying only on identity having revoked its credential.
 * Boundary: an abstract class that is its own token. Optional: with no reader bound the pipeline does not check, so a
 *           package or product without devices is unaffected. The devices service provides the durable driver (its
 *           registry's status); this package ships the memory driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (device order); ADR 0361 (decision 7: identity revokes the credential); ADR 0263 (ports
 *                     are classes).
 */
import { Port } from "@stackra/contracts";

/**
 * Tells whether a device is revoked.
 *
 * @example
 * if (await reader.isRevoked(request.device.deviceId)) throw DeviceRevokedError.create();
 */
export abstract class DeviceStatusReader extends Port {
  /** True when the device is revoked; an unknown device is not revoked (the credential decides who it is). */
  abstract isRevoked(deviceId: string): Promise<boolean>;
}
