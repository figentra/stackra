/**
 * Stackra file contract:
 * Purpose: `crc32`, the CRC-32 (IEEE) checksum of bytes or of a string's UTF-8 bytes, optionally continued from an
 *          earlier chunk's value: a zip entry's checksum, the suffix an API key carries.
 * Boundary: public and pure. A checksum, never a proof of authenticity.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); APPNOTE.TXT 4.4.7; ADR 0278 (decision 5); stackra-224
 *                     (one copy, was data-transfer and identity).
 */

/** The CRC-32 lookup table. */
const TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1)
    value = value & 1 ? 0xed_b8_83_20 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

/**
 * The checksum of `previous`'s bytes followed by `input` (`previous` is 0 for the first chunk); a string is read as
 * its UTF-8 bytes.
 *
 * @example
 * crc32("123456789"); // 0xcbf43926
 * crc32(second, crc32(first)); // the checksum of first then second
 */
export function crc32(input: Uint8Array | string, previous = 0): number {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let crc = (previous ^ 0xff_ff_ff_ff) >>> 0;
  for (const byte of bytes) crc = (TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}
