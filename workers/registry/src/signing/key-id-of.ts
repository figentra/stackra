/**
 * Stackra file contract:
 * Purpose: `keyIdOf`: the keyid of an SPKI DER key.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */
import { toBase64 } from "#src/bytes/to-base64";
import type { Bytes } from "#src/interfaces/bytes.type";

/** The keyid of an SPKI DER key. */
export async function keyIdOf(spki: Bytes): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", spki));
  return `SHA256:${toBase64(hash).replace(/=+$/, "")}`;
}
