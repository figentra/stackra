/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SeoConfig` and its shipped `SeoConfig$`: the defaults, the key `seo`, the template
 *          web app's override in its exact shape (Base alias, `override` fields, nested objects restated) built and
 *          frozen by `buildConfig`, and the refusals: a title template without `%s`, a page size above the protocol,
 *          a robots path with a line break or not rooted, a user agent that is not one token, an unknown OG kind.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 20); ADR 0301 (decisions 2, 3 and 7).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SeoConfig, SeoConfig as BaseSeoConfig } from "#config/seo.config";
import { SeoConfig$ } from "#core/constants/seo-config-schema.constant";
import { OgKind } from "#core/enums/og-kind.enum";

/** The template web app's override, under the Base alias. */
class SiteSeoConfig extends BaseSeoConfig {
  override titleTemplate = "%s · {siteName}";

  override robots: BaseSeoConfig["robots"] = {
    "*": { allow: ["/"], disallow: ["/store?q=", "/*?preview="] },
  };

  override sitemapPageSize = 5_000;

  override noindexParams = ["q"];

  override consumedSitemaps = true;

  override og: BaseSeoConfig["og"] = {
    kinds: Enum.values(OgKind),
    width: 1200,
    height: 630,
    cacheSeconds: 86_400,
  };

  override hreflang = true;

  override jsonLd = true;
}

/** A robots record whose one group disallows `path`. */
const group = (path: string) => ({ "*": { allow: [], disallow: [path] } });

describe("SeoConfig", () => {
  it("defaults to a findable site with protocol-safe sitemap pages", () => {
    const config = buildConfig(SeoConfig);
    expect({ ...config }).toEqual({
      titleTemplate: "%s",
      robots: { "*": { allow: ["/"], disallow: [] } },
      sitemapPageSize: 10_000,
      noindexParams: [],
      consumedSitemaps: false,
      og: { kinds: ["site", "page", "product"], width: 1200, height: 630, cacheSeconds: 86_400 },
      hreflang: true,
      jsonLd: true,
    });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("matches its shipped schema's defaults", () => {
    expect({ ...buildConfig(SeoConfig) }).toEqual(SeoConfig$.parse({}));
  });

  it("derives the key seo", () => {
    expect(configKey(SeoConfig, "seo")).toBe("seo");
    expect(configKey(SiteSeoConfig, "seo")).toBe("seo");
  });

  it("builds the template's override", () => {
    const config = buildConfig(SiteSeoConfig);
    expect(config).toBeInstanceOf(SeoConfig);
    expect(config.titleTemplate).toBe("%s · {siteName}");
    expect(config.robots["*"]?.disallow).toEqual(["/store?q=", "/*?preview="]);
    expect(config.sitemapPageSize).toBe(5_000);
    expect(config.noindexParams).toEqual(["q"]);
    expect(config.consumedSitemaps).toBe(true);
    expectTypeOf(config.og.kinds).toEqualTypeOf<OgKind[]>();
    expectTypeOf(config.sitemapPageSize).toEqualTypeOf<number>();
  });

  it("refuses a wrongly typed override at compile time and at build", () => {
    class Wrong extends SeoConfig {
      // @ts-expect-error -- a string is not a page size
      override sitemapPageSize = "many";
    }
    expect(() => buildConfig(Wrong)).toThrow(ConfigInvalidError);
  });

  it("refuses a title template without the title", () => {
    class Wrong extends SeoConfig {
      override titleTemplate = "{siteName}";
    }
    expect(() => buildConfig(Wrong)).toThrow(ConfigInvalidError);
  });

  it("refuses a sitemap page above the protocol's 50,000 URLs", () => {
    expect(SeoConfig$.safeParse({ sitemapPageSize: 50_000 }).success).toBe(true);
    expect(SeoConfig$.safeParse({ sitemapPageSize: 50_001 }).success).toBe(false);
    expect(SeoConfig$.safeParse({ sitemapPageSize: 0 }).success).toBe(false);
  });

  it("refuses a robots value that could add a directive", () => {
    expect(SeoConfig$.safeParse({ robots: group("/a\nUser-agent: evil") }).success).toBe(false);
    expect(SeoConfig$.safeParse({ robots: group("admin") }).success).toBe(false);
    expect(
      SeoConfig$.safeParse({ robots: { "Bad Bot": { allow: [], disallow: ["/"] } } }).success,
    ).toBe(false);
    expect(
      SeoConfig$.safeParse({ robots: { Googlebot: { allow: [], disallow: ["/"] } } }).success,
    ).toBe(true);
  });

  it("refuses an unknown Open Graph kind and an empty kind list", () => {
    const og = { width: 1200, height: 630, cacheSeconds: 60 };
    expect(SeoConfig$.safeParse({ og: { ...og, kinds: ["video"] } }).success).toBe(false);
    expect(SeoConfig$.safeParse({ og: { ...og, kinds: [] } }).success).toBe(false);
  });

  it("extends like gen's override schema of a member", () => {
    const Member$ = SeoConfig$.extend({
      titleTemplate: SeoConfig$.shape.titleTemplate.unwrap().default("%s · {siteName}"),
      sitemapPageSize: SeoConfig$.shape.sitemapPageSize.unwrap().default(5_000),
    });
    const parsed = Member$.parse({});
    expect(parsed.titleTemplate).toBe("%s · {siteName}");
    expect(parsed.sitemapPageSize).toBe(5_000);
    expect(parsed.hreflang).toBe(true);
  });
});
