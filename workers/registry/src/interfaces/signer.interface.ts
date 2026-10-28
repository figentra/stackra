/**
 * Stackra file contract:
 * Purpose: `Signer`: the registry's signer.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */
import type { RegistryKey } from "#src/interfaces/registry-key.interface";
import type { RegistrySignature } from "#src/interfaces/registry-signature.interface";

/** The registry's signer. */
export interface Signer {
  /** Signs `name@version:integrity` with the current key. */
  sign: (name: string, version: string, integrity: string) => Promise<RegistrySignature>;
  /** Lists the current key and the retired keys for `/-/npm/v1/keys`. */
  keys: () => readonly RegistryKey[];
}
