/**
 * Stackra file contract:
 * Purpose: `fromBase64`: base64 (standard or url-safe, padded or not) to bytes; throws on anything else.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 8).
 */
import type { Bytes } from "#src/interfaces/bytes.type";

/** Base64 (standard or url-safe, padded or not) to bytes; throws on anything else. */
export function fromBase64(text: string): Bytes {
  const standard = text.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(standard + "=".repeat((4 - (standard.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
