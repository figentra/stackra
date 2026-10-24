/**
 * Stackra file contract:
 * Purpose: `LicenceFileOptions`, what `verifyLicenceFile` needs: the account's Ed25519 verify key and, for an
 *          encrypted file, the licence key that decrypts it.
 * Boundary: a type only. The verify key is public; the licence key is the customer's and is never stored or logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 and 2).
 */

/** How to verify one licence file. */
export interface LicenceFileOptions {
  /** The Keygen account's Ed25519 verify key, 64 hex characters (32 bytes). */
  readonly publicKey: string;

  /** The licence key; needed only for a file whose algorithm is `aes-256-gcm+ed25519`. */
  readonly licenceKey?: string;
}
