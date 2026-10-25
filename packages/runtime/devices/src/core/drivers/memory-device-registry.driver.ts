/**
 * Stackra file contract:
 * Purpose: `MemoryDeviceRegistryDriver`, the `DeviceRegistry` driver that keeps devices and pairings in memory: the
 *          `memory` candidate of tests and local runs of the devices service.
 * Boundary: no store; `devices` and `pairings` are inspectable. Codes come from `newPairingCode`; pairing ids from
 *           `crypto.randomUUID`. A code is single use: a claimed or expired one refuses. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { DeviceStatus } from "#contracts/enums/device-status.enum";
import { PairingState } from "#contracts/enums/pairing-state.enum";
import { DeviceRegistry } from "#contracts/ports/device-registry.port";
import type { DeviceDraft } from "#contracts/types/device-draft.type";
import type { DeviceListQuery } from "#contracts/types/device-list-query.type";
import type { PairingCode } from "#contracts/types/pairing-code.type";
import type { PairingRequest } from "#contracts/types/pairing-request.type";
import type { PairingStatus } from "#contracts/types/pairing-status.type";
import type { RegisteredDevice } from "#contracts/types/registered-device.type";
import { PairingCodeInvalidError } from "#core/errors/pairing-code-invalid.error";
import { newPairingCode } from "#core/functions/new-pairing-code.function";

/** An open or finished pairing. */
interface Pairing extends PairingCode {
  readonly deviceId: string;
  claimed: boolean;
}

/**
 * A device registry in memory.
 *
 * @example
 * const registry = new MemoryDeviceRegistryDriver();
 * const { code } = await registry.openPairing({ deviceId: "dev_1", at, expiresAt });
 * await registry.claim(code, { name: "Till 2", kind: "till", nodeId: null }, at);
 */
export class MemoryDeviceRegistryDriver extends Driver(DeviceRegistry) {
  /** The registered devices, in pairing order. */
  readonly devices: RegisteredDevice[] = [];

  /** Every pairing opened. */
  readonly pairings: Pairing[] = [];

  /**
   * Opens a code for the device.
   *
   * @throws PairingCodeInvalidError when the device is already registered and active.
   */
  async openPairing(request: PairingRequest): Promise<PairingCode> {
    const existing = this.devices.find((device) => device.id === request.deviceId);
    if (existing?.status === DeviceStatus.Active) throw PairingCodeInvalidError.create();
    let code = newPairingCode();
    while (this.pairings.some((pairing) => pairing.code === code)) code = newPairingCode();
    const pairing: Pairing = {
      pairingId: globalThis.crypto.randomUUID(),
      code,
      expiresAt: new Date(request.expiresAt.getTime()),
      deviceId: request.deviceId,
      claimed: false,
    };
    this.pairings.push(pairing);
    return { pairingId: pairing.pairingId, code: pairing.code, expiresAt: pairing.expiresAt };
  }

  /**
   * Registers the device whose pending code is `code` (case and spaces ignored), or re-activates a retired one.
   *
   * @throws PairingCodeInvalidError when no unclaimed, unexpired code matches.
   */
  async claim(code: string, draft: DeviceDraft, at: Date): Promise<RegisteredDevice> {
    const typed = code.replace(/[\s-]/g, "").toUpperCase();
    const pairing = this.pairings.find((candidate) => candidate.code === typed);
    if (pairing === undefined || pairing.claimed || pairing.expiresAt.getTime() <= at.getTime())
      throw PairingCodeInvalidError.create();
    pairing.claimed = true;
    const device: RegisteredDevice = {
      id: pairing.deviceId,
      name: draft.name,
      kind: draft.kind,
      nodeId: draft.nodeId,
      status: DeviceStatus.Active,
      pairedAt: new Date(at.getTime()),
      lastSeenAt: null,
      retiredAt: null,
    };
    const index = this.devices.findIndex((candidate) => candidate.id === device.id);
    if (index === -1) this.devices.push(device);
    else this.devices[index] = device;
    return device;
  }

  /** The pairing's state at `at`. */
  async pairingStatus(pairingId: string, at: Date): Promise<PairingStatus> {
    const pairing = this.pairings.find((candidate) => candidate.pairingId === pairingId);
    if (pairing?.claimed === true)
      return { state: PairingState.Paired, deviceId: pairing.deviceId };
    if (pairing === undefined || pairing.expiresAt.getTime() <= at.getTime())
      return { state: PairingState.Expired, deviceId: null };
    return { state: PairingState.Pending, deviceId: null };
  }

  /** The device, or null. */
  async find(deviceId: string): Promise<RegisteredDevice | null> {
    return this.devices.find((device) => device.id === deviceId) ?? null;
  }

  /** The devices matching every non-null field of `query`. */
  async list(query: DeviceListQuery): Promise<readonly RegisteredDevice[]> {
    return this.devices.filter(
      (device) =>
        (query.status === null || device.status === query.status) &&
        (query.kind === null || device.kind === query.kind) &&
        (query.nodeId === null || device.nodeId === query.nodeId),
    );
  }

  /** Stamps an active device's last call. */
  async recordSeen(deviceId: string, at: Date): Promise<void> {
    const index = this.devices.findIndex((device) => device.id === deviceId);
    const device = this.devices[index];
    if (device?.status === DeviceStatus.Active)
      this.devices[index] = { ...device, lastSeenAt: new Date(at.getTime()) };
  }

  /** Retires the device once. */
  async retire(deviceId: string, at: Date): Promise<boolean> {
    const index = this.devices.findIndex((device) => device.id === deviceId);
    const device = this.devices[index];
    if (device === undefined) return false;
    if (device.status === DeviceStatus.Active)
      this.devices[index] = {
        ...device,
        status: DeviceStatus.Retired,
        retiredAt: new Date(at.getTime()),
      };
    return true;
  }
}
