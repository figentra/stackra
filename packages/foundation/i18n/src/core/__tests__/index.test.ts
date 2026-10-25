/**
 * Stackra file contract:
 * Purpose: entry test of `@stackra/i18n`'s `.` barrel: it exports exactly the values the template and the registry row
 *          name, and its public types resolve with the shapes gen's `#stackra/i18n` uses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as i18n from "#core/index";
import type { I18nKey, LoadCatalogue, Locale } from "#core/index";

describe("@stackra/i18n", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(i18n).sort()).toEqual([
      "I18nConfig",
      "I18nConfig$",
      "Locale",
      "LocaleUrlStrategy",
      "NumberingSystem",
      "formatMessage",
      "keys",
      "mergeCatalogues",
    ]);
  });

  it("resolves its public types as gen's #stackra/i18n uses them", () => {
    const loaders: Record<string, Partial<Record<Locale, LoadCatalogue>>> = {
      web: { en: async () => ({ default: { nav: { home: "Home" } } }) },
    };
    const fallbacks: Record<Locale, readonly Locale[]> = {
      "ar-SA": ["ar", "en"],
      ar: ["en"],
      "en-US": ["en"],
      en: [],
    };
    expect(Object.keys(loaders.web ?? {})).toEqual(["en"]);
    expect(fallbacks["ar-SA"]).toEqual(["ar", "en"]);
    expectTypeOf(i18n.keys({ web: { nav: ["home"] } }).web.nav.home).toEqualTypeOf<I18nKey>();
    // @ts-expect-error -- a raw string is not a key
    const raw: I18nKey = "web::nav.home";
    expect(raw).toBe("web::nav.home");
  });
});
