/**
 * Stackra file contract:
 * Purpose: unit tests of `searchRulesOf` and `SEARCH_RULE_LINE`: pins and hides of the read's phrase only (a hidden
 *          id never pinned), typed boost values, the factor and days bounds, the last recency winning, other indexes
 *          and broken lines skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; stackra-326.
 */
import { describe, expect, it } from "@stackra/testing";

import { SEARCH_RULE_LINE } from "#core/constants/search-rule-line.constant";
import { searchRulesOf } from "#core/functions/search-rules-of.function";

const RULES = [
  "# merchandising",
  "products pin Linen Shirt: prd_9, prd_8",
  "products hide linen shirt: prd_8, prd_7",
  "products pin sofa: prd_1",
  "catalogue.products boost featured=true: 2",
  "products boost stock=0: 0.5",
  "products boost brand=acme: 1.5",
  "products boost brand=huge: 50",
  "products recency publishedAt: 30",
  "products recency updatedAt: 7",
  "articles pin linen shirt: art_1",
  "products pin: nothing",
].join("\n");

describe(searchRulesOf, () => {
  it("reads the rules of the read's phrase and the index's boosts and recency", () => {
    expect(searchRulesOf(RULES, ["products", "catalogue.products"], ["linen", "shirt"])).toEqual({
      pinned: ["prd_9"],
      hidden: ["prd_8", "prd_7"],
      boosts: [
        { path: "featured", value: true, factor: 2 },
        { path: "stock", value: 0, factor: 0.5 },
        { path: "brand", value: "acme", factor: 1.5 },
      ],
      recency: { path: "updatedAt", halfLifeDays: 7 },
    });
  });

  it("applies no pin of another phrase or index", () => {
    expect(searchRulesOf(RULES, ["articles"], ["sofa"])).toEqual({
      pinned: [],
      hidden: [],
      boosts: [],
    });
  });

  it("accepts blank, comment and rule lines only", () => {
    for (const line of ["", "  ", "# note", "products pin a b: x_1", "products recency at: 1.5"])
      expect(SEARCH_RULE_LINE.test(line)).toBe(true);
    for (const line of [
      "pin a: x",
      "products pin a",
      "products boost a: 2",
      "products recency a: x",
    ])
      expect(SEARCH_RULE_LINE.test(line)).toBe(false);
  });
});
