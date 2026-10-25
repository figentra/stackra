/**
 * Stackra file contract:
 * Purpose: `encodeTlv`, tag-length-value bytes with one-byte tags and lengths: the receipt QR encoding of the ZATCA
 *          mandate.
 * Boundary: a pure function; text values are UTF-8. A value longer than 255 bytes cannot be written in one length
 *           byte and is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/**
 * The concatenated fields, in the order given.
 *
 * @example
 * toBase64(encodeTlv([[1, "Seller"], [2, "300000000000003"]]));
 * @throws RangeError when a tag is outside 1 to 255 or a value is longer than 255 bytes.
 */
export function encodeTlv(fields: readonly (readonly [number, string | Uint8Array])[]): Uint8Array {
  const parts: number[] = [];
  for (const [tag, value] of fields) {
    const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
    if (!Number.isInteger(tag) || tag < 1 || tag > 255)
      throw new RangeError(`encodeTlv: a tag is one byte from 1 to 255, got ${tag}`);
    if (bytes.length > 255)
      throw new RangeError(
        `encodeTlv: tag ${tag} holds ${bytes.length} bytes, more than one length byte allows`,
      );
    parts.push(tag, bytes.length, ...bytes);
  }
  return Uint8Array.from(parts);
}
