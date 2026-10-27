/**
 * Stackra file contract:
 * Purpose: `RegistryKey`: one entry of `/-/npm/v1/keys`.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */

/** One entry of `/-/npm/v1/keys`. */
export interface RegistryKey {
  readonly expires: string | null;
  readonly keyid: string;
  readonly keytype: string;
  readonly scheme: string;
  readonly key: string;
}
