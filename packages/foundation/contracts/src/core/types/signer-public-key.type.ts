/**
 * Stackra file contract:
 * Purpose: `SignerPublicKey`, the public half of a `Signer`'s key: its id, the algorithm and the key as DER
 *          SubjectPublicKeyInfo, so a proof bundle or a verifier's trust list can carry it as text.
 * Boundary: a type only. Public, never secret; a verifier trusts it only when it got it from its own trust list, not
 *           from the bundle being verified.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3); ADR 0416.
 */

/** A verification key. */
export type SignerPublicKey = {
  /** The key's id, matching `Signature.keyId`. */
  readonly keyId: string;
  /** The algorithm: ECDSA P-256 over SHA-256. */
  readonly algorithm: "ES256";
  /** The DER SubjectPublicKeyInfo, base64url. */
  readonly spki: string;
};
