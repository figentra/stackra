/**
 * Stackra file contract:
 * Purpose: `crc32`, the CRC-32 (IEEE) checksum of a string's UTF-8 bytes: the suffix an API key carries so a scanner
 *          and the gateway reject a mistyped or malformed key without a lookup.
 * Boundary: internal and pure. A checksum, never a proof of authenticity: only the hashed lookup proves a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decision 5).
 */

/** The CRC-32 lookup table. */
const TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

/**
 * The checksum of `text`.
 *
 * @example
 * crc32("123456789"); // 0xcbf43926
 */
export function crc32(text: string): number {
  let crc = 0xffffffff;
  for (const byte of new TextEncoder().encode(text))
    crc = (TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
