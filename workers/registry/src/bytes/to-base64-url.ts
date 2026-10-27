/**
 * Stackra file contract:
 * Purpose: `toBase64Url`: bytes to unpadded base64url.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 8).
 */
import { toBase64 } from "#src/bytes/to-base64";

/** Bytes to unpadded base64url. */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
