/**
 * Stackra file contract:
 * Purpose: `toHex`, lower-case hexadecimal of bytes.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/**
 * Two lower-case digits per byte.
 *
 * @example
 * toHex(new Uint8Array([0, 255])); // "00ff"
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
