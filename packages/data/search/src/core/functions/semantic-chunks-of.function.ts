/**
 * Stackra file contract:
 * Purpose: `semanticChunksOf`, the passage chunker: it cuts a semantic row's text into passages of at most `size`
 *          characters on word boundaries, each repeating the last few words of the one before (`overlap` characters at
 *          most), so a long field is embedded in pieces an embedding model reads whole.
 * Boundary: pure over the text it is given, which `semanticPassageOf` has already guarded and folded. A word longer than
 *           `size` is a passage of its own, cut at `size`. At most `MAX_SEMANTIC_CHUNKS` passages come back; the tail
 *           past them is not embedded.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: the vector lane); stackra-301 (gap se8: the chunker).
 */

import { MAX_SEMANTIC_CHUNKS } from "#core/constants/max-semantic-chunks.constant";

/**
 * The passages of `text`, in order; none for a blank text.
 *
 * @param size - the most characters per passage, a whole number from 1.
 * @param overlap - the most characters of the previous passage's end to repeat, under `size`.
 * @throws RangeError when `size` is not a whole number from 1, or `overlap` is not a whole number from 0 under `size`.
 * @example
 * semanticChunksOf("one two three four", 9, 4); // ["one two", "two three", "four"]
 */
export function semanticChunksOf(text: string, size: number, overlap: number): readonly string[] {
  if (!Number.isInteger(size) || size < 1)
    throw new RangeError(`A passage size is a whole number from 1, got ${size}`);
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= size)
    throw new RangeError(
      `A passage overlap is a whole number from 0 under ${size}, got ${overlap}`,
    );
  const words = text.split(/\s+/).flatMap((word): string[] => {
    const pieces: string[] = [];
    for (let at = 0; at < word.length; at += size) pieces.push(word.slice(at, at + size));
    return pieces;
  });
  const chunks: string[] = [];
  let current: string[] = [];
  let length = 0;
  for (const word of words) {
    if (length > 0 && length + 1 + word.length > size) {
      chunks.push(current.join(" "));
      // shortcut: the tail past MAX_SEMANTIC_CHUNKS is not embedded; raise it with the passage id slots if rows outgrow it.
      if (chunks.length === MAX_SEMANTIC_CHUNKS) return chunks;
      const kept: string[] = [];
      let keptLength = 0;
      for (let at = current.length - 1; at >= 0; at--) {
        const previous = current[at] ?? "";
        const next = keptLength + (keptLength === 0 ? 0 : 1) + previous.length;
        if (next > overlap || next + 1 + word.length > size) break;
        kept.unshift(previous);
        keptLength = next;
      }
      current = kept;
      length = keptLength;
    }
    current.push(word);
    length += (length === 0 ? 0 : 1) + word.length;
  }
  if (length > 0) chunks.push(current.join(" "));
  return chunks;
}
