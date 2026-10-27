/**
 * Stackra file contract:
 * Purpose: unit tests of `searchSynonymsOf`: sets are equivalences read for the named index in one language (or every
 *          language), terms are normalised, comment, broken and multi-word entries are left out, and each word's
 *          synonyms are capped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0221 (decision 3); ADR 0403.
 */
import { describe, expect, it } from "@stackra/testing";

import { searchSynonymsOf } from "#core/functions/search-synonyms-of.function";
import { searchWordsOf } from "#core/functions/search-words-of.function";

const TEXT = [
  "# living room",
  "products en: Sofa, couch, Settee",
  "products en: couch, divan",
  "products ar: كنبة, أريكة",
  "catalogue.products en: TV, television",
  "articles en: post, entry",
  "products en: t shirt, tee",
  "not a set line",
  "",
].join("\n");

describe(searchSynonymsOf, () => {
  it("maps each normalised word to the other words of every set it is in", () => {
    const synonyms = searchSynonymsOf(TEXT, ["products", "catalogue.products"], "en");
    expect(synonyms.get("sofa")).toEqual(["couch", "settee"]);
    expect(synonyms.get("couch")).toEqual(["sofa", "settee", "divan"]);
    expect(synonyms.get("tv")).toEqual(["television"]);
    expect(synonyms.has("post")).toBe(false);
    expect(synonyms.has("كنبة")).toBe(false);
  });

  it("reads every language without one, and Arabic terms in the index's normalisation", () => {
    const synonyms = searchSynonymsOf(TEXT, ["products"]);
    const [sofa] = searchWordsOf("كنبة");
    const [couch] = searchWordsOf("أريكة");
    expect(synonyms.get(sofa ?? "")).toEqual([couch]);
    expect(synonyms.has("tv")).toBe(false);
  });

  it("leaves out a multi-word term, and a set left with one word", () => {
    const synonyms = searchSynonymsOf(TEXT, ["products"], "en");
    expect(synonyms.has("tee")).toBe(false);
    expect(synonyms.has("t")).toBe(false);
  });

  it("caps each word's synonyms at eight", () => {
    const terms = Array.from({ length: 12 }, (_, at) => `w${at}`).join(", ");
    expect(searchSynonymsOf(`products en: ${terms}`, ["products"], "en").get("w0")).toHaveLength(8);
  });
});
