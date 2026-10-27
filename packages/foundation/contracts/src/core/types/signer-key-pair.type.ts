/**
 * Stackra file contract:
 * Purpose: `SignerKeyPair`, the Web Crypto key pair `MemorySignerDriver` signs with, written structurally so the type
 *          resolves under node-only libs: `CryptoKey` is global in both the DOM lib and @types/node, but the global
 *          `CryptoKeyPair` exists only in the DOM lib, and services typecheck this package's source without it.
 * Boundary: a type only. A DOM `CryptoKeyPair` and the pair `crypto.subtle.generateKey` returns under node both fit it.
 * Runtime: isomorphic
 * Governing contract: ADR 0416.
 */

/** An asymmetric Web Crypto key pair. */
export type SignerKeyPair = {
  /** The verification key; extractable, so `publicKey()` can export it. */
  readonly publicKey: CryptoKey;
  /** The signing key. */
  readonly privateKey: CryptoKey;
};
