/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizeArabic`: diacritics and tatweel removed, alef and hamza forms unified, taa marbuta
 *          and alef maqsura folded, the article stripped per word, and Latin text left alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (note of 2026-10-24).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizeArabic } from "#core/functions/normalize-arabic.function";

describe("normalizeArabic", () => {
  it("folds the spellings search treats as one", () => {
    expect(normalizeArabic("الْمَدْرَسَةُ")).toBe("مدرسه");
    expect(normalizeArabic("أحمد")).toBe(normalizeArabic("احمد"));
    expect(normalizeArabic("إسلام")).toBe("اسلام");
    expect(normalizeArabic("مصطفى")).toBe("مصطفي");
    expect(normalizeArabic("محـــمد")).toBe("محمد");
    expect(normalizeArabic("مسؤول")).toBe("مسوول");
  });

  it("strips the article from each word but keeps short words", () => {
    expect(normalizeArabic("شركة  النور  للتجارة")).toBe("شركه نور للتجاره");
    expect(normalizeArabic("الى")).toBe("الي");
  });

  it("leaves Latin text alone", () => {
    expect(normalizeArabic("  Acme Trading ")).toBe("Acme Trading");
  });
});
