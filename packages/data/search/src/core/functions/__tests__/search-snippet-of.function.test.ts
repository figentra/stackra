/**
 * Stackra file contract:
 * Purpose: unit tests of `searchSnippetOf`: an excerpt around the first matching word, cut on word boundaries with
 *          ellipses, Arabic matched without diacritics, and `undefined` when nothing matches.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0221.
 */
import { describe, expect, it } from "@stackra/testing";

import { searchSnippetOf } from "#core/functions/search-snippet-of.function";

describe(searchSnippetOf, () => {
  it("cuts an excerpt around the first match", () => {
    expect(searchSnippetOf("The linen shirt comes in white and sand.", ["shirt"], 6)).toBe(
      "…linen shirt comes…",
    );
    expect(searchSnippetOf("Short text", ["short"])).toBe("Short text");
  });

  it("matches Arabic with diacritics in the text", () => {
    expect(searchSnippetOf("قميص مِنَ الكَتّان", ["كتان"])).toBe("قميص مِنَ الكَتّان");
  });

  it("is undefined when no word occurs", () => {
    expect(searchSnippetOf("The linen shirt", ["wool"])).toBeUndefined();
  });
});
