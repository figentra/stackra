/**
 * Stackra file contract:
 * Purpose: `importReceiptPublicKey(text)`, the gate's verification key from its configured text: the raw 32-byte
 *          Ed25519 public key as base64url (`peripherals.exitTokenPublicKey`).
 * Boundary: Web Crypto only; a public key, so it is configuration, not a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2); RFC 8032 (Ed25519).
 */
import { fromBase64Url } from "#core/functions/from-base64-url.function";

/**
 * Imports the receipt tokens' public key.
 *
 * @example
 * const key = await importReceiptPublicKey(config.exitTokenPublicKey);
 *
 * @throws RangeError when the text is not 32 bytes of base64url.
 */
export async function importReceiptPublicKey(text: string): Promise<CryptoKey> {
  const raw = fromBase64Url(text);
  if (raw === null || raw.length !== 32)
    throw new RangeError(
      "importReceiptPublicKey: expected a 32-byte Ed25519 public key as base64url",
    );
  return crypto.subtle.importKey("raw", raw, "Ed25519", true, ["verify"]);
}
