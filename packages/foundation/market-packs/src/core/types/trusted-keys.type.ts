/**
 * Stackra file contract:
 * Purpose: `TrustedKeys`, the public keys a deployment accepts pack signatures from: key id to the base64 of a raw
 *          32-byte Ed25519 public key.
 * Boundary: a type only. The keys are deployment configuration (public, not secret); no key is written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */

/** Key id to base64 raw Ed25519 public key. */
export type TrustedKeys = Readonly<Record<string, string>>;
