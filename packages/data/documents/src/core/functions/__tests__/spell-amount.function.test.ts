/**
 * Stackra file contract:
 * Purpose: unit tests of `spellAmount`: major and minor units from the exponent, each language's joiner, a whole
 *          currency, and the refusals for a language or minor noun it lacks.
 * Boundary: test only.
 *           The currency names are fixtures, not market-pack values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { AmountWordsUnavailableError } from "#core/errors/amount-words-unavailable.error";
import { spellAmount } from "#core/functions/spell-amount.function";

const CURRENCY = {
  exponent: 2,
  ar: {
    major: {
      singular: "ريال",
      dual: "ريالان",
      plural: "ريالات",
      accusative: "ريالًا",
      feminine: false,
    },
    minor: { singular: "هللة", dual: "هللتان", plural: "هللات", accusative: "هللةً", feminine: true },
  },
  en: {
    major: { singular: "riyal", plural: "riyals" },
    minor: { singular: "halala", plural: "halalas" },
  },
};

describe("spellAmount", () => {
  it("spells major and minor units", () => {
    expect(spellAmount(123550n, CURRENCY, "ar")).toBe("ألف ومائتان وخمسة وثلاثون ريالًا وخمسون هللةً");
    expect(spellAmount(123550n, CURRENCY, "en")).toBe(
      "one thousand two hundred thirty-five riyals and fifty halalas",
    );
    expect(spellAmount(500n, CURRENCY, "en")).toBe("five riyals");
    expect(spellAmount(5n, CURRENCY, "en")).toBe("five halalas");
    expect(spellAmount(0n, CURRENCY, "en")).toBe("zero riyals");
  });

  it("spells a currency with no minor unit", () => {
    expect(
      spellAmount(7n, { exponent: 0, en: { major: { singular: "yen", plural: "yen" } } }, "en"),
    ).toBe("seven yen");
  });

  it("refuses what it cannot spell", () => {
    expect(() => spellAmount(100n, CURRENCY, "fr")).toThrow(AmountWordsUnavailableError);
    const wholeOnly = { exponent: 2, en: { major: CURRENCY.en.major } };
    expect(() => spellAmount(150n, wholeOnly, "en")).toThrow(AmountWordsUnavailableError);
    expect(() => spellAmount(-1n, CURRENCY, "en")).toThrow(RangeError);
  });
});
