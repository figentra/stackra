/**
 * Stackra file contract:
 * Purpose: `newLicenceToken`: a fresh licence token, `stkl_` and 43 base64url characters (32 random bytes), with its
 *          SHA-256 hex, the only form the registry stores.
 * Boundary: pure Web Crypto; no I/O. The token leaves the Worker once, in the answer of the call that made it.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 13).
 */
import { sha256Hex } from "#src/bytes/sha256-hex";
import { toBase64Url } from "#src/bytes/to-base64-url";

/**
 * A fresh licence token and its hash.
 *
 * @example
 * const { token, hash } = await newLicenceToken(); // token "stkl_…" (48 characters), hash 64 hex characters
 */
export async function newLicenceToken(): Promise<{
  readonly token: string;
  readonly hash: string;
}> {
  const token = `stkl_${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`;
  return { token, hash: await sha256Hex(token) };
}
