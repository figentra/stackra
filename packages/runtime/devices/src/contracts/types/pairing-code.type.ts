/**
 * Stackra file contract:
 * Purpose: `PairingCode`, a code a device shows (on screen or as a QR) for a person to enter in the console, with the
 *          id the device polls it by and when it expires.
 * Boundary: a type only. The code is short and single use; it pairs nothing on its own: a signed-in person with the
 *           permission enters it. How long it lives is a setting the caller passes.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); OS 0016 (pairing by code, QR or console approval).
 */

/** An open pairing. */
export interface PairingCode {
  /** The id the device polls the pairing by. */
  readonly pairingId: string;

  /** The code a person enters (`K7Q4-M2XR` without the dash). */
  readonly code: string;

  /** When the code stops working. */
  readonly expiresAt: Date;
}
