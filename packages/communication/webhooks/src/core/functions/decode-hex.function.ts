/**
 * Stackra file contract:
 * Purpose: `decodeHex`, the bytes of a hexadecimal text, or `undefined` when it is not an even run of hex digits.
 * Boundary: internal; reads each hex signature of an `hmac` scheme header (Stripe, Checkout.com). Never throws, so a
 *           malformed signature counts as one that does not match.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15).
 */

/**
 * The decoded bytes.
 *
 * @example
 * decodeHex("cafe"); // Uint8Array [0xca, 0xfe]
 * decodeHex("caf"); // undefined
 */
export function decodeHex(text: string): Uint8Array<ArrayBuffer> | undefined {
  if (text.length === 0 || text.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(text)) return undefined;
  const bytes = new Uint8Array(text.length / 2);
  for (let index = 0; index < bytes.length; index += 1)
    bytes[index] = Number.parseInt(text.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}
