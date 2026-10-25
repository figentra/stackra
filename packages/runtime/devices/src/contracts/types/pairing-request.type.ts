/**
 * Stackra file contract:
 * Purpose: `PairingRequest`, what the registry is asked to open a pairing with: the id the device minted at install
 *          (so its id never changes when it pairs), when the request came and when the code expires.
 * Boundary: a type only. The expiry comes from a setting the devices service reads; nothing here fixes a lifetime.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0338 (decision 1: the device id is stable for the install).
 */

/** A pairing to open. */
export interface PairingRequest {
  /** The device's install id, as its `DeviceIdentity` answers it. */
  readonly deviceId: string;

  /** When the device asked. */
  readonly at: Date;

  /** When the code stops working. */
  readonly expiresAt: Date;
}
