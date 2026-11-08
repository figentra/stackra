/**
 * Stackra file contract:
 * Purpose: `VerifiedSender`, who signed a delivery the inbox accepted: the producer service and the key id.
 * Boundary: a type only; the inbox sets the envelope's `producer` from `service`, never from the body.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11, 16 and 18, amendment of 2026-11-02).
 */

/** The verified producer of a delivery. */
export interface VerifiedSender {
  /** The producer service whose listed key verified the signature. */
  readonly service: string;

  /** The key id that verified it. */
  readonly keyId: string;
}
