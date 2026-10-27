/**
 * Stackra file contract:
 * Purpose: `RegistrySignature`: one entry of `dist.signatures`.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */

/** One entry of `dist.signatures`. */
export interface RegistrySignature {
  readonly keyid: string;
  readonly sig: string;
}
