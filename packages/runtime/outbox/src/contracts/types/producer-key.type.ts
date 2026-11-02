/**
 * Stackra file contract:
 * Purpose: `ProducerKey`, one public key a producer signs cross-app deliveries with: its id and its base64url Ed25519
 *          public key, as the producer's manifest lists it per environment.
 * Boundary: a type only, JSON-safe. A public key is not a secret; the private half never appears here.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 16, amendment of 2026-11-02).
 */

/** A producer's public signing key. */
export interface ProducerKey {
  /** The key id a request names (`pay-dev-2026-11`). */
  readonly id: string;

  /** The raw Ed25519 public key, base64url. */
  readonly publicKey: string;
}
