/**
 * Stackra file contract:
 * Purpose: `detectEncoding`, the encoding of a CSV file from its first bytes: a byte order mark wins, valid UTF-8 is
 *          UTF-8, anything else is the caller's fallback (the market pack's legacy encoding).
 * Boundary: pure. It names only the Unicode encodings; a legacy encoding reaches it as the `fallback` argument. A
 *           multi-byte character cut at the end of the sample does not count against UTF-8.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 3).
 */
import { UnreadableEncodingError } from "#core/errors/unreadable-encoding.error";

/**
 * The encoding label of a file that starts with `sample`.
 *
 * @example
 * detectEncoding(firstChunk, pack.legacyEncoding); // "utf-8", or the pack's legacy encoding
 * @throws UnreadableEncodingError when `sample` has no byte order mark, is not UTF-8 and `fallback` is absent.
 */
export function detectEncoding(sample: Uint8Array, fallback?: string): string {
  if (sample[0] === 0xef && sample[1] === 0xbb && sample[2] === 0xbf) return "utf-8";
  if (sample[0] === 0xff && sample[1] === 0xfe) return "utf-16le";
  if (sample[0] === 0xfe && sample[1] === 0xff) return "utf-16be";
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample, { stream: true });
    return "utf-8";
  } catch {
    if (fallback === undefined) throw UnreadableEncodingError.create({});
    return fallback;
  }
}
