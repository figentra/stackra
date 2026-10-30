/**
 * Stackra file contract:
 * Purpose: unit tests of `numberFormatIn` and `formatNumber`, the digits matrix: Latin and Arabic-Indic digits in
 *          English and Arabic, for plain numbers, money and percentages, whatever the tag's own keyword says (an
 *          engine that ignores `-u-nu-`, as Hermes on iOS does, is the tag without one); a locale whose group mark is
 *          a dot keeps its meaning; an engine without `formatToParts` still gets the digits and marks.
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0192 (decision 2, as amended 2026-10-28).
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { formatNumber } from "#core/functions/format-number.function";
import { intlLocale } from "#core/functions/intl-locale.function";
import { numberFormatIn } from "#core/functions/number-format-in.function";

const { Latn, Arab, User } = NumberingSystem;

/** The bidi marks Intl adds around Arabic numbers, which this matrix does not compare. */
const bare = (text: string) =>
  text.replaceAll(/[\u200e\u200f\u061c]/g, "").replaceAll(/[\u00a0\u202f]/g, " ");

const USD = { style: "currency", currency: "USD" } as const;

describe("formatNumber", () => {
  it.each([
    ["en", Latn, "1,310.5", "$1,310.50"],
    ["ar", Latn, "1,310.5", "1,310.50 US$"],
    ["en", Arab, "١٬٣١٠٫٥", "١٬٣١٠٫٥٠ $"],
    ["ar", Arab, "١٬٣١٠٫٥", "١٬٣١٠٫٥٠ US$"],
  ] as const)("writes %s in %s digits", (locale, numerals, plain, money) => {
    // The tag the provider builds, and the bare locale an engine ignoring the keyword effectively formats in.
    for (const tag of [intlLocale(locale, numerals), locale]) {
      expect(bare(formatNumber(1310.5, tag, undefined, numerals))).toBe(plain);
      expect(bare(formatNumber(1310.5, tag, USD, numerals))).toBe(money);
    }
  });

  it("takes the digits from the tag's keyword by default", () => {
    expect(formatNumber(1310, "en-u-nu-arab")).toBe("١٬٣١٠");
    expect(formatNumber(1310, "ar-u-nu-latn")).toBe("1,310");
  });

  it("keeps a dot group mark a group mark", () => {
    expect(formatNumber(1310.5, "de", undefined, Arab)).toBe("١٬٣١٠٫٥");
    expect(formatNumber(1310.5, "de-u-nu-arab", undefined, Latn)).toBe("1.310,5");
  });

  it("leaves the engine's own digits alone for user", () => {
    expect(formatNumber(1310, "ar-u-nu-arab", undefined, User)).toBe(
      new Intl.NumberFormat("ar-u-nu-arab").format(1310),
    );
  });
});

describe("numberFormatIn", () => {
  it("formats percentages in the digits", () => {
    expect(bare(numberFormatIn("en", { style: "percent" }, Arab).format(0.25))).toBe("٢٥٪");
  });

  it("falls back to the text's digits and marks where the engine has no formatToParts", () => {
    const prototype = Intl.NumberFormat.prototype;
    const original = Object.getOwnPropertyDescriptor(prototype, "formatToParts");
    if (original === undefined) throw new Error("this engine has no formatToParts to take away");
    Object.defineProperty(prototype, "formatToParts", { configurable: true, value: undefined });
    try {
      expect(numberFormatIn("en", undefined, Arab).format(1310.5)).toBe("١٬٣١٠٫٥");
      expect(numberFormatIn("en-u-nu-arab", undefined, Latn).format(1310.5)).toBe("1,310.5");
    } finally {
      Object.defineProperty(prototype, "formatToParts", original);
    }
  });
});
