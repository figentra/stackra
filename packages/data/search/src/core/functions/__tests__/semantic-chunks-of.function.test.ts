/**
 * Stackra file contract:
 * Purpose: unit tests of `semanticChunksOf`: passages of at most `size` characters on word boundaries, the overlap of
 *          the previous passage's last words, a long word cut, a blank text, the chunk cap and the refused sizes.
 * Boundary: test only; pure.
 * Runtime: isomorphic (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 1); stackra-301.
 */
import { describe, expect, it } from "@stackra/testing";

import { MAX_SEMANTIC_CHUNKS } from "#core/constants/max-semantic-chunks.constant";
import { semanticChunksOf } from "#core/functions/semantic-chunks-of.function";

describe(semanticChunksOf, () => {
  it("keeps a short text whole", () => {
    expect(semanticChunksOf("unpaid invoice", 100, 20)).toEqual(["unpaid invoice"]);
  });

  it("cuts on word boundaries and repeats the last words that fit the overlap", () => {
    expect(semanticChunksOf("one two three four", 9, 4)).toEqual(["one two", "two three", "four"]);
    expect(semanticChunksOf("a b c d e f", 5, 0)).toEqual(["a b c", "d e f"]);
  });

  it("cuts a word longer than a passage and gives nothing for a blank text", () => {
    expect(semanticChunksOf("abcdefgh", 3, 0)).toEqual(["abc", "def", "gh"]);
    expect(semanticChunksOf(" \n ", 10, 2)).toEqual([]);
  });

  it("never passes the chunk cap and every passage fits its size", () => {
    const text = Array.from({ length: 500 }, (_, at) => `word${at}`).join(" ");
    const chunks = semanticChunksOf(text, 40, 10);
    expect(chunks).toHaveLength(MAX_SEMANTIC_CHUNKS);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(40);
  });

  it("refuses a size or an overlap it cannot honour", () => {
    expect(() => semanticChunksOf("x", 0, 0)).toThrow(RangeError);
    expect(() => semanticChunksOf("x", 10, 10)).toThrow(RangeError);
    expect(() => semanticChunksOf("x", 10, -1)).toThrow(RangeError);
  });
});
