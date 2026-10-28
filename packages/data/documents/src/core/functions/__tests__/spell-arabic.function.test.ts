/**
 * Stackra file contract:
 * Purpose: unit tests of `spellArabic`: gender agreement, the dual, the plural of 3 to 10, the accusative of 11 to 99,
 *          the scales and the range.
 * Boundary: test only.
 *           The nouns are fixtures, not market-pack values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { spellArabic } from "#core/functions/spell-arabic.function";

const RIYAL = {
  singular: "ريال",
  dual: "ريالان",
  plural: "ريالات",
  accusative: "ريالًا",
  feminine: false,
};
const LIRA = {
  singular: "ليرة",
  dual: "ليرتان",
  plural: "ليرات",
  accusative: "ليرةً",
  feminine: true,
};

describe("spellArabic", () => {
  it("spells zero, one and two with the noun", () => {
    expect(spellArabic(0n, RIYAL)).toBe("صفر ريال");
    expect(spellArabic(1n, RIYAL)).toBe("ريال واحد");
    expect(spellArabic(1n, LIRA)).toBe("ليرة واحدة");
    expect(spellArabic(2n, LIRA)).toBe("ليرتان");
  });

  it("agrees in gender and takes the right noun form", () => {
    expect(spellArabic(3n, RIYAL)).toBe("ثلاثة ريالات");
    expect(spellArabic(3n, LIRA)).toBe("ثلاث ليرات");
    expect(spellArabic(11n, RIYAL)).toBe("أحد عشر ريالًا");
    expect(spellArabic(12n, LIRA)).toBe("اثنتا عشرة ليرةً");
    expect(spellArabic(15n, LIRA)).toBe("خمس عشرة ليرةً");
    expect(spellArabic(21n, LIRA)).toBe("إحدى وعشرون ليرةً");
    expect(spellArabic(100n, RIYAL)).toBe("مائة ريال");
  });

  it("spells thousands and millions", () => {
    expect(spellArabic(1235n, RIYAL)).toBe("ألف ومائتان وخمسة وثلاثون ريالًا");
    expect(spellArabic(2000n, RIYAL)).toBe("ألفان ريال");
    expect(spellArabic(3000n, LIRA)).toBe("ثلاثة آلاف ليرة");
    expect(spellArabic(15_000n, RIYAL)).toBe("خمسة عشر ألفًا ريال");
    expect(spellArabic(1_000_005n, RIYAL)).toBe("مليون وخمسة ريالات");
  });

  it("refuses a negative count and one past the scales", () => {
    expect(() => spellArabic(-1n, RIYAL)).toThrow(RangeError);
    expect(() => spellArabic(10n ** 15n, RIYAL)).toThrow(RangeError);
  });
});
