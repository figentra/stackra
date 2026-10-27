/**
 * Stackra file contract:
 * Purpose: unit tests of `SEARCH_SYNONYM_LINE`: blank, comment and set lines pass with their groups; a set of one
 *          term, a missing language and a bad index fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0403.
 */
import { describe, expect, it } from "@stackra/testing";

import { SEARCH_SYNONYM_LINE } from "#core/constants/search-synonym-line.constant";

describe("SEARCH_SYNONYM_LINE", () => {
  it("accepts blank, comment and set lines", () => {
    expect(SEARCH_SYNONYM_LINE.test("")).toBe(true);
    expect(SEARCH_SYNONYM_LINE.test("  # sofas")).toBe(true);
    expect(SEARCH_SYNONYM_LINE.exec("catalogue.products ar: كنبة, أريكة")?.slice(1)).toEqual([
      "catalogue.products",
      "ar",
      "كنبة, أريكة",
    ]);
  });

  it("refuses a set of one term, a missing language and a bad index", () => {
    expect(SEARCH_SYNONYM_LINE.test("products en: sofa")).toBe(false);
    expect(SEARCH_SYNONYM_LINE.test("products: sofa, couch")).toBe(false);
    expect(SEARCH_SYNONYM_LINE.test("Products en: sofa, couch")).toBe(false);
    expect(SEARCH_SYNONYM_LINE.test("products en: sofa, couch # note")).toBe(false);
  });
});
