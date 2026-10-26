/**
 * Stackra file contract:
 * Purpose: `Signature`, a detached signature as a `Signer` returns it and an offline verifier reads it: the signing
 *          key's id, the algorithm and the signature bytes.
 * Boundary: a type only, plain JSON so it travels inside a checkpoint row or a proof bundle. `ES256` is ECDSA on
 *           P-256 with SHA-256; the value is the 64-byte `r || s` form (IEEE P1363, as Web Crypto and JWS write it),
 *           base64url without padding.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a signed checkpoint); ADR 0416.
 */

/** A detached signature. */
export type Signature = {
  /** The id of the key that signed; a verifier picks the public key by it. */
  readonly keyId: string;
  /** The algorithm: ECDSA P-256 over SHA-256. */
  readonly algorithm: "ES256";
  /** The 64-byte `r || s` signature, base64url. */
  readonly value: string;
};
