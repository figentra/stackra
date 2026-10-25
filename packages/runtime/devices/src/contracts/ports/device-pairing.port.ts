/**
 * Stackra file contract:
 * Purpose: the `DevicePairing` port: the device side of pairing. The device asks the hub for a code to show, checks
 *          until a person has entered it, and once paired keeps the credential the hub hands it where its
 *          `DeviceCredential` driver reads it. `forget` unpairs the install locally.
 * Boundary: an abstract class that is its own token, keyed `devices.DevicePairing`. The device's id never changes
 *           when it pairs: the install id its `DeviceIdentity` answers is the id it is registered under. The credential
 *           is never returned to the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended: identity issues the credential); ADR
 *                     0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { PairingCode } from "#contracts/types/pairing-code.type";
import type { PairingStatus } from "#contracts/types/pairing-status.type";

/**
 * Pairs this device.
 *
 * @example
 * const pairing = await this.pairing.begin(); // show pairing.code
 * const status = await this.pairing.check(pairing); // poll until paired or expired
 */
export abstract class DevicePairing extends Port {
  /** Type-only port key, so `DriverName<DevicePairing>` narrows to this port's drivers. */
  declare readonly "~key": "devices.DevicePairing";

  /** Asks the hub for a pairing code for this device. */
  abstract begin(): Promise<PairingCode>;

  /** The pairing's state; once paired, the credential is kept for `DeviceCredential`. */
  abstract check(pairing: PairingCode): Promise<PairingStatus>;

  /** Drops the kept credential, so the device calls the hub as unpaired. The install id stays. */
  abstract forget(): Promise<void>;
}
