/**
 * Stackra file contract:
 * Purpose: `sampleScore(key)`, a number in `[0, 1)` fixed for `key` (32-bit FNV-1a of its code points), so the
 *          delivery engine samples by visitor: one anonymous id is always in or always out of a sample, and a funnel
 *          keeps every step of the visitors it keeps.
 * Boundary: pure; not a security hash, only an even spread. The engine compares it with a sample rate.
 * Runtime: isomorphic
 * Governing contract: analytics gap 6 (sampling, stackra-406).
 */

/** FNV-1a 32-bit offset basis and prime. */
const OFFSET = 0x81_1c_9d_c5;
const PRIME = 0x01_00_01_93;

/**
 * The fixed score of `key`.
 *
 * @example
 * sampleScore("anon_01jb9x3k7m2c8q4w6e5r0t1y2z") < config.sampleRate; // this visitor is in the sample
 */
export function sampleScore(key: string): number {
  let hash = OFFSET;
  for (const char of key) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, PRIME) >>> 0;
  }
  return hash / 2 ** 32;
}
