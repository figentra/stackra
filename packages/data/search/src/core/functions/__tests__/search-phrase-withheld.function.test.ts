/**
 * Stackra file contract:
 * Purpose: unit tests of `searchPhraseWithheld`: e-mail addresses and runs of six or more digits are withheld, plain
 *          phrases and short numbers are not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; stackra-326.
 */
import { describe, expect, it } from "@stackra/testing";

import { searchPhraseWithheld } from "#core/functions/search-phrase-withheld.function";

describe(searchPhraseWithheld, () => {
  it("withholds what looks like personal data", () => {
    expect(searchPhraseWithheld("sara@example.com")).toBe(true);
    expect(searchPhraseWithheld("call 050 123 4567")).toBe(true);
    expect(searchPhraseWithheld("order 123456")).toBe(true);
  });

  it("keeps plain phrases", () => {
    expect(searchPhraseWithheld("linen shirt")).toBe(false);
    expect(searchPhraseWithheld("iphone 15 pro 256")).toBe(false);
  });
});
