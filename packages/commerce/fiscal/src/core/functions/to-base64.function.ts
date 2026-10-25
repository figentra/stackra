/**
 * Stackra file contract:
 * Purpose: `toBase64`, standard base64 (RFC 4648 section 4, padded) of bytes or of text as UTF-8.
 * Boundary: a pure function over `btoa`, in chunks so a large payload does not overflow the argument list.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/**
 * Base64 with padding.
 *
 * @example
 * toBase64("hi"); // "aGk="
 */
export function toBase64(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}
