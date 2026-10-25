/**
 * Stackra file contract:
 * Purpose: `contentHashOf`, the content hash of a file: `sha256:<hex>` of its bytes.
 * Boundary: WebCrypto (`crypto.subtle`), wherever it exists (Node, browsers, Workers). The algorithm is named in the
 *           value, so a later algorithm can sit beside it.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 4).
 */
import { hexOf } from "#core/functions/hex-of.function";

/**
 * `sha256:<hex>` of `bytes`.
 *
 * @example
 * await contentHashOf(new TextEncoder().encode("abc")); // "sha256:ba7816bf…"
 */
export async function contentHashOf(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return `sha256:${hexOf(new Uint8Array(digest))}`;
}
