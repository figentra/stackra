/**
 * Stackra file contract:
 * Purpose: `bytesOfBase64(text)`, the bytes of Base64 or base64url text (padding optional), or `undefined` when it is
 *          not Base64.
 * Boundary: internal; the event signer reads its private key and the inbox verifier its public keys and signatures
 *           with it. Pure, `atob` only, so it runs in a Worker too.
 * Runtime: isomorphic
 * Governing contract: RFC 4648 (sections 4 and 5).
 */

/**
 * The decoded bytes of `text`.
 *
 * @example
 * bytesOfBase64("AQID"); // Uint8Array [1, 2, 3]
 */
export function bytesOfBase64(text: string): Uint8Array<ArrayBuffer> | undefined {
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(text)) return undefined;
  try {
    const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
    return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
  } catch {
    return undefined;
  }
}
