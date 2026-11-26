/**
 * Stackra file contract:
 * Purpose: `RelayKey`, one public key of a producer's relay: its id and its Ed25519 public key.
 * Boundary: a type only; public facts (a public key is not a secret). The public key is the raw 32 bytes in base64url.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 16, amendment of 2026-11-02).
 */

/** A producer's signing key, by its public half. */
export interface RelayKey {
  /** The key id the signature header names (`pay-dev-2026-11`). */
  readonly id: string;

  /** The raw Ed25519 public key, base64url. */
  readonly publicKey: string;
}
