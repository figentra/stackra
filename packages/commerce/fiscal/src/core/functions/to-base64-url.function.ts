/**
 * Stackra file contract:
 * Purpose: `toBase64Url`, URL-safe base64 without padding (RFC 4648 section 5), as JWS uses.
 * Boundary: a pure function over `toBase64`.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */
import { toBase64 } from "#core/functions/to-base64.function";

/**
 * Encodes `input` as unpadded base64url.
 *
 * @example
 * toBase64Url(new Uint8Array([251, 255])); // "-_8"
 */
export function toBase64Url(input: string | Uint8Array): string {
  return toBase64(input).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
