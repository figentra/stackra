/**
 * Stackra file contract:
 * Purpose: unit tests of `spellEnglish`: units, teens, hyphenated tens, hundreds, scales, singular and plural nouns.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { spellEnglish } from "#core/functions/spell-english.function";

const UNIT = { singular: "unit", plural: "units" };

describe("spellEnglish", () => {
  it("spells counts with the noun", () => {
    expect(spellEnglish(0n, UNIT)).toBe("zero units");
    expect(spellEnglish(1n, UNIT)).toBe("one unit");
    expect(spellEnglish(13n, UNIT)).toBe("thirteen units");
    expect(spellEnglish(21n, UNIT)).toBe("twenty-one units");
    expect(spellEnglish(1235n, UNIT)).toBe("one thousand two hundred thirty-five units");
    expect(spellEnglish(2_000_040n, UNIT)).toBe("two million forty units");
  });

  it("refuses a negative count and one past the scales", () => {
    expect(() => spellEnglish(-1n, UNIT)).toThrow(RangeError);
    expect(() => spellEnglish(10n ** 15n, UNIT)).toThrow(RangeError);
  });
});
