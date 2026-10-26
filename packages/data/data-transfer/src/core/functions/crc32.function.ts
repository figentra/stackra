/**
 * Stackra file contract:
 * Purpose: `crc32`, the CRC-32 (IEEE) of a byte stream, updated chunk by chunk: the checksum each zip entry carries.
 * Boundary: internal and pure; `writeZip` folds every chunk of an entry through it.
 * Runtime: isomorphic
 * Governing contract: APPNOTE.TXT 4.4.7.
 */

/** The CRC-32 lookup table. */
const TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

/**
 * The checksum of `previous`'s bytes followed by `chunk` (`previous` is 0 for the first chunk).
 *
 * @example
 * crc32(new TextEncoder().encode("123456789")); // 0xcbf43926
 */
export function crc32(chunk: Uint8Array, previous = 0): number {
  let crc = (previous ^ 0xffffffff) >>> 0;
  for (const byte of chunk) crc = (TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
