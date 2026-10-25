/**
 * Stackra file contract:
 * Purpose: unit tests of `CURRENCY_WORDS_SCHEMA`: accepts a currency with Arabic and English names, refuses a missing
 *          gender or an exponent out of range.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { CURRENCY_WORDS_SCHEMA } from "#core/constants/currency-words-schema.constant";

const NOUN = { singular: "a", dual: "b", plural: "c", accusative: "d", feminine: false };

describe("CURRENCY_WORDS_SCHEMA", () => {
  it("accepts names per language", () => {
    expect(
      CURRENCY_WORDS_SCHEMA.safeParse({
        exponent: 2,
        ar: { major: NOUN, minor: NOUN },
        en: { major: { singular: "unit", plural: "units" } },
      }).success,
    ).toBe(true);
  });

  it("refuses a noun without gender and an exponent out of range", () => {
    const { feminine: _feminine, ...withoutGender } = NOUN;
    expect(
      CURRENCY_WORDS_SCHEMA.safeParse({ exponent: 2, ar: { major: withoutGender } }).success,
    ).toBe(false);
    expect(CURRENCY_WORDS_SCHEMA.safeParse({ exponent: 9 }).success).toBe(false);
  });
});
