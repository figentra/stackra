/**
 * Stackra file contract:
 * Purpose: unit tests of `localePath`: the default locale unprefixed and the others under their lowercase tag, the
 *          locale root with its slash, a path moved between mounts instead of prefixed twice, the `prefix` strategy,
 *          the query and fragment kept, a relative path rooted, and a segment that only looks like a locale.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 6); ADR 0297 (decision 4).
 */
import { Locale, LocaleUrlStrategy } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { localePath } from "#core/functions/locale-path.function";

/** The template's four locales, English the default. */
const I18N = {
  locales: [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa],
  defaultLocale: Locale.En,
  urlStrategy: LocaleUrlStrategy.PrefixExceptDefault,
};

describe("localePath", () => {
  it("keeps the default locale unprefixed and prefixes the others in lowercase", () => {
    expect(localePath("/pricing", Locale.En, I18N)).toBe("/pricing");
    expect(localePath("/pricing", Locale.ArSa, I18N)).toBe("/ar-sa/pricing");
    expect(localePath("/pricing", Locale.EnUs, I18N)).toBe("/en-us/pricing");
  });

  it("gives a locale root its slash", () => {
    expect(localePath("/", Locale.Ar, I18N)).toBe("/ar/");
    expect(localePath("/", Locale.En, I18N)).toBe("/");
  });

  it("moves a path between mounts", () => {
    expect(localePath("/ar-sa/store/mug", Locale.En, I18N)).toBe("/store/mug");
    expect(localePath("/ar-sa/store/mug", Locale.Ar, I18N)).toBe("/ar/store/mug");
    expect(localePath("/AR-SA", Locale.EnUs, I18N)).toBe("/en-us/");
  });

  it("prefixes every locale under the prefix strategy", () => {
    const prefix = { ...I18N, urlStrategy: LocaleUrlStrategy.Prefix };
    expect(localePath("/pricing", Locale.En, prefix)).toBe("/en/pricing");
    expect(localePath("/en/pricing", Locale.ArSa, prefix)).toBe("/ar-sa/pricing");
  });

  it("keeps the query and fragment", () => {
    expect(localePath("/store?collection=mugs#top", Locale.ArSa, I18N)).toBe(
      "/ar-sa/store?collection=mugs#top",
    );
    expect(localePath("/ar/store?q=a", Locale.En, I18N)).toBe("/store?q=a");
  });

  it("roots a relative path", () => {
    expect(localePath("pricing", Locale.Ar, I18N)).toBe("/ar/pricing");
  });

  it("leaves a segment that only starts like a locale", () => {
    expect(localePath("/arabic-coffee", Locale.En, I18N)).toBe("/arabic-coffee");
    expect(localePath("/fr/pricing", Locale.Ar, I18N)).toBe("/ar/fr/pricing");
  });
});
