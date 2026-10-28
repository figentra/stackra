/**
 * Stackra file contract:
 * Purpose: `fromBase64`, the bytes of standard or URL-safe base64 text.
 * Boundary: a pure function over `atob`; invalid text is the `DOMException` `atob` throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/**
 * Decoded bytes; padding is optional.
 *
 * @example
 * fromBase64("aGk="); // Uint8Array [104, 105]
 */
export function fromBase64(text: string): Uint8Array {
  const standard = text.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="));
  // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte, so the code unit is the byte
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
