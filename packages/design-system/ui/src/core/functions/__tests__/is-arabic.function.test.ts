/**
 * Stackra file contract:
 * Purpose: proves `isArabic` is true for Arabic tags in any case and region and false for other languages, Persian and
 *          Urdu included, and for an empty or malformed tag.
 * Boundary: pure function.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 2); ADR 0022 (test placement).
 */
// @covers sta-350:P-012
import { isArabic } from "#core/functions/is-arabic.function";

describe("isArabic", () => {
  it.each(["ar", "ar-EG", "AR", "ar-Latn"])("%s is Arabic", (locale) => {
    expect(isArabic(locale)).toBe(true);
  });

  it.each(["en", "en-AR", "fa", "ur", "he", "", "-"])("%s is not Arabic", (locale) => {
    expect(isArabic(locale)).toBe(false);
  });
});
