/**
 * Stackra file contract:
 * Purpose: unit tests of `searchWordsOf`: Latin accents and case folded, Arabic diacritics, tatweel and hamza removed,
 *          the three Arabic letter variants unified, words split on anything that is not a letter or digit.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { searchWordsOf } from "#core/functions/search-words-of.function";

describe(searchWordsOf, () => {
  it("folds case and Latin accents and splits on punctuation", () => {
    expect(searchWordsOf("Café-Crème, NAÏVE")).toEqual(["cafe", "creme", "naive"]);
    expect(searchWordsOf("SKU AB-1234")).toEqual(["sku", "ab", "1234"]);
  });

  it("removes Arabic diacritics and the tatweel", () => {
    expect(searchWordsOf("مَكْتَبَة")).toEqual(["مكتبه"]);
    expect(searchWordsOf("كتـــاب")).toEqual(["كتاب"]);
  });

  it("unifies hamza forms and the letter variants", () => {
    expect(searchWordsOf("أحمد إسلام آمن")).toEqual(["احمد", "اسلام", "امن"]);
    expect(searchWordsOf("مستشفى مدرسة ٱلكتاب")).toEqual(["مستشفي", "مدرسه", "الكتاب"]);
  });

  it("keeps repeats and returns nothing for punctuation only", () => {
    expect(searchWordsOf("red red")).toEqual(["red", "red"]);
    expect(searchWordsOf(" -- ")).toEqual([]);
  });
});
