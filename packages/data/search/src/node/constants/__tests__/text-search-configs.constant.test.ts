/**
 * Stackra file contract:
 * Purpose: unit tests of `TEXT_SEARCH_CONFIGS`: frozen, keyed by two-letter language subtags, with Arabic and English
 *          stemmed, each of the seven languages on its built-in analyser, and every name a plain lower-case word safe
 *          to inline into SQL.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { TEXT_SEARCH_CONFIGS } from "#node/constants/text-search-configs.constant";

describe("TEXT_SEARCH_CONFIGS", () => {
  it("stems Arabic and English", () => {
    expect(TEXT_SEARCH_CONFIGS["ar"]).toBe("arabic");
    expect(TEXT_SEARCH_CONFIGS["en"]).toBe("english");
    expect(TEXT_SEARCH_CONFIGS["xx"]).toBeUndefined();
  });

  it("stems each of the seven languages with its Postgres built-in analyser", () => {
    expect(
      ["ar", "en", "fr", "de", "es", "it", "nl"].map((language) => TEXT_SEARCH_CONFIGS[language]),
    ).toEqual(["arabic", "english", "french", "german", "spanish", "italian", "dutch"]);
  });

  it("is frozen, with language keys and lower-case names", () => {
    expect(Object.isFrozen(TEXT_SEARCH_CONFIGS)).toBe(true);
    for (const [language, config] of Object.entries(TEXT_SEARCH_CONFIGS)) {
      expect(language).toMatch(/^[a-z]{2}$/);
      expect(config).toMatch(/^[a-z]+$/);
    }
  });
});
