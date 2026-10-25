/**
 * Stackra file contract:
 * Purpose: unit tests of `alternates`: one absolute URL per shipped locale keyed by its BCP 47 tag plus `x-default`,
 *          built on the site's canonical origin (a trailing slash dropped), from a path with or without a locale
 *          prefix, reading the i18n configuration through the context.
 * Boundary: test only; the context is a plain object in the route context's shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decisions 6 and 7).
 */
import { I18nConfig, Locale, LocaleUrlStrategy } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { alternates } from "#core/functions/alternates.function";
import type { AlternatesContext } from "#core/types/alternates-context.type";

/** A route context over the template's four locales. */
function context(origin = "https://acme.test") {
  const config = vi.fn<AlternatesContext["config"]>(() => ({
    locales: [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa],
    defaultLocale: Locale.En,
    urlStrategy: LocaleUrlStrategy.PrefixExceptDefault,
  }));
  const ctx: AlternatesContext = { site: { origin }, config };
  return Object.assign(ctx, { config });
}

describe("alternates", () => {
  it("answers every locale and x-default", () => {
    expect(alternates(context(), "/pricing")).toEqual({
      en: "https://acme.test/pricing",
      "en-US": "https://acme.test/en-us/pricing",
      ar: "https://acme.test/ar/pricing",
      "ar-SA": "https://acme.test/ar-sa/pricing",
      "x-default": "https://acme.test/pricing",
    });
  });

  it("reads the i18n configuration through the context", () => {
    const ctx = context();
    alternates(ctx, "/");
    expect(ctx.config).toHaveBeenCalledWith(I18nConfig);
  });

  it("accepts a path already under a locale prefix", () => {
    expect(alternates(context(), "/ar-sa/store/mug")["x-default"]).toBe(
      "https://acme.test/store/mug",
    );
  });

  it("drops a trailing slash of the origin", () => {
    expect(alternates(context("https://acme.test/"), "/")["ar"]).toBe("https://acme.test/ar/");
  });
});
