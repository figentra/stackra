/**
 * Stackra file contract:
 * Purpose: the `DeviceRegistry` port: a tenant's devices (inventory) and the server side of pairing: open a code for a
 *          device, register the device when a person enters the code, answer the pairing's state, record when a
 *          device was seen and retire it.
 * Boundary: an abstract class that is its own token, keyed `devices.DeviceRegistry`, implemented by the devices
 *           service (OS 0016) over its own store; this package ships the memory driver. The registry never issues or
 *           revokes a credential: identity does (ADR 0361 decision 7), and the devices service calls it on pairing and
 *           retirement. Every instant is an argument.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: registry and pairing ports in @stackra/devices); ADR 0235 (decision 1,
 *                     as amended); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { DeviceClaimFacts } from "#contracts/types/device-claim-facts.type";
import type { DeviceDraft } from "#contracts/types/device-draft.type";
import type { DeviceListQuery } from "#contracts/types/device-list-query.type";
import type { PairingCode } from "#contracts/types/pairing-code.type";
import type { PairingRequest } from "#contracts/types/pairing-request.type";
import type { PairingStatus } from "#contracts/types/pairing-status.type";
import type { RegisteredDevice } from "#contracts/types/registered-device.type";

/**
 * The device registry.
 *
 * @example
 * const pairing = await registry.openPairing({ deviceId, at: clock.now(), expiresAt });
 * const device = await registry.claim(input.code, { name: "Till 2", kind: "till", nodeId }, clock.now(), {
 *   scopeId: ctx.scopeId,
 *   market,
 *   pairedBy: ctx.principalId,
 * });
 */
export abstract class DeviceRegistry extends Port {
  /** Type-only port key, so `DriverName<DeviceRegistry>` narrows to this port's drivers. */
  declare readonly "~key": "devices.DeviceRegistry";

  /**
   * Opens a pairing code for the device.
   *
   * @throws PairingCodeInvalidError when the device is already registered and active.
   */
  abstract openPairing(request: PairingRequest): Promise<PairingCode>;

  /**
   * Registers the device whose pending code is `code`, recording `facts` with it (each null when left out).
   *
   * @throws PairingCodeInvalidError when no pending code matches or it expired before `at`.
   */
  abstract claim(
    code: string,
    draft: DeviceDraft,
    at: Date,
    facts?: DeviceClaimFacts,
  ): Promise<RegisteredDevice>;

  /** The pairing's state at `at`; an unknown pairing reads as expired. */
  abstract pairingStatus(pairingId: string, at: Date): Promise<PairingStatus>;

  /** The device, or null. */
  abstract find(deviceId: string): Promise<RegisteredDevice | null>;

  /** The devices matching `query`, oldest pairing first. */
  abstract list(query: DeviceListQuery): Promise<readonly RegisteredDevice[]>;

  /** Records that an active device called at `at`; a retired or unknown device is left as it is. */
  abstract recordSeen(deviceId: string, at: Date): Promise<void>;

  /** Retires the device at `at`; retiring it again changes nothing. Returns false for an unknown device. */
  abstract retire(deviceId: string, at: Date): Promise<boolean>;
}
