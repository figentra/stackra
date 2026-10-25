/**
 * Stackra file contract:
 * Purpose: `RegisteredDevice`, one device in a tenant's registry: its id (the one its `DeviceIdentity` answers), its
 *          name, kind and node, its standing, and when it was paired, last seen and retired.
 * Boundary: a type only; the registry's record, not a credential. The hub reads a calling device's id from its
 *           credential, never from a request body.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0338 (decision 1: the device id).
 */
import type { DeviceStatus } from "#contracts/enums/device-status.enum";
import type { DeviceDraft } from "#contracts/types/device-draft.type";

/** A registered device. */
export interface RegisteredDevice extends DeviceDraft {
  /** The device's id, the same its `DeviceIdentity` answers. */
  readonly id: string;

  /** In service or retired. */
  readonly status: DeviceStatus;

  /** When it was paired. */
  readonly pairedAt: Date;

  /** When it last called the hub; null before its first call. */
  readonly lastSeenAt: Date | null;

  /** When it was retired; null while active. */
  readonly retiredAt: Date | null;
}
