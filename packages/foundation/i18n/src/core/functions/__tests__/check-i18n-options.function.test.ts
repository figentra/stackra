/**
 * Stackra file contract:
 * Purpose: unit tests of `checkI18nOptions`: shipped default and fallback locales pass, and a default locale, a
 *          fallback key or a chain entry outside `locales` is reported at its path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080.
 */
import { describe, expect, it } from "@stackra/testing";

import { I18nConfig$ } from "#core/constants/i18n-config-schema.constant";
import { checkI18nOptions } from "#core/functions/check-i18n-options.function";

const Checked$ = I18nConfig$.superRefine(checkI18nOptions);

/** The issue paths of `input`, or an empty list when it passes. */
const pathsOf = (input: unknown) =>
  Checked$.safeParse(input).error?.issues.map((issue) => issue.path) ?? [];

describe("checkI18nOptions", () => {
  it("passes shipped default and fallback locales", () => {
    expect(
      pathsOf({
        locales: ["en", "ar", "ar-SA"],
        defaultLocale: "ar",
        fallbacks: { "ar-SA": ["ar", "en"], ar: ["en"], en: [] },
      }),
    ).toEqual([]);
  });

  it("reports a default locale outside locales", () => {
    expect(pathsOf({ locales: ["en"], defaultLocale: "ar" })).toEqual([["defaultLocale"]]);
  });

  it("reports a fallback key and a chain entry outside locales at their paths", () => {
    expect(
      pathsOf({ locales: ["en", "ar"], fallbacks: { "ar-SA": ["ar"], ar: ["en", "en-US"] } }),
    ).toEqual([
      ["fallbacks", "ar-SA"],
      ["fallbacks", "ar", 1],
    ]);
  });
});
