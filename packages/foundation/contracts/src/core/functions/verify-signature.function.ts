/**
 * Stackra file contract:
 * Purpose: `verifySignature`, the offline check of a `Signer`'s signature: true only when the signature names the
 *          key's id and algorithm and verifies over the message with the key.
 * Boundary: pure apart from Web Crypto, so it runs in Node, a browser, a worker and `stackra audit:verify`. Never
 *           throws on bad input: a malformed key or signature is `false`. The caller chooses which keys it trusts.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3); ADR 0416.
 */
import { base64urlDecode } from "#core/functions/base64url-decode.function";
import type { Signature } from "#core/types/signature.type";
import type { SignerPublicKey } from "#core/types/signer-public-key.type";

/**
 * Whether `signature` is `key`'s signature of `message`.
 *
 * @example
 * const ok = await verifySignature(trusted, new TextEncoder().encode(canonicalJson(checkpoint)), row.signature);
 */
export async function verifySignature(
  key: SignerPublicKey,
  message: Uint8Array,
  signature: Signature,
): Promise<boolean> {
  if (signature.keyId !== key.keyId || signature.algorithm !== key.algorithm) return false;
  try {
    const publicKey = await globalThis.crypto.subtle.importKey(
      "spki",
      base64urlDecode(key.spki),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return await globalThis.crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      base64urlDecode(signature.value),
      new Uint8Array(message),
    );
  } catch {
    return false;
  }
}
