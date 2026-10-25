/**
 * Stackra file contract:
 * Purpose: `PairingStatus`, what a device learns when it checks its pairing: the state, and its registered id once
 *          paired.
 * Boundary: a type only. The credential the hub hands a paired device is stored by the pairing driver and never
 *           appears here.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7).
 */
import type { PairingState } from "#contracts/enums/pairing-state.enum";

/** A pairing's state. */
export interface PairingStatus {
  /** Pending, paired or expired. */
  readonly state: PairingState;

  /** The registered device's id once paired; null otherwise. */
  readonly deviceId: string | null;
}
