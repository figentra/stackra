/**
 * Stackra file contract:
 * Purpose: `RegistryKey`: one entry of `/-/npm/v1/keys`.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */

/** One entry of `/-/npm/v1/keys`. */
export interface RegistryKey {
  /** When the key stopped signing, or null for the current key. */
  readonly expires: string | null;
  /** The key id that signatures name, `SHA256:<base64 of the SPKI digest>`. */
  readonly keyid: string;
  /** The key algorithm npm expects, such as `ecdsa-sha2-nistp256`. */
  readonly keytype: string;
  /** The signature scheme npm expects, such as `ecdsa-sha2-nistp256`. */
  readonly scheme: string;
  /** The public key as base64 SPKI DER. */
  readonly key: string;
}
