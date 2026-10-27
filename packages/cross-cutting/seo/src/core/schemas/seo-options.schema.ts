/**
 * Stackra file contract:
 * Purpose: `SeoOptions`, the options shape of `SeoConfig`: how a site is found: the title template (the app defaults,
 *          first link of every page's SEO chain), robots groups per crawler, the URLs per sitemap page, the search
 *          parameters that make a page `noindex`, whether consumed manifests' sitemap sources are written, the Open
 *          Graph image route, and whether heads carry hreflang alternates and JSON-LD.
 * Boundary: a shape class: fields, types, defaults and field rules only; `SeoConfig$` mirrors it and is the schema
 *           `buildConfig` validates with. Nested objects are replaced whole by an override. The site URL is env, not
 *           a field here.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decisions 2, 3 and 7); ADR 0294 (decision 19); ADR 0305 (conventions 1).
 */
import { Field, Int, Schema, Str } from "@stackra/validation";

import { SeoConfig$ } from "#core/constants/seo-config-schema.constant";
import { OgKind } from "#core/enums/og-kind.enum";

/** The options of `SeoConfig`. */
export class SeoOptions extends Schema {
  /** The page title template: `%s` is the page title and `{siteName}` the site's name. */
  @Str({
    min: 2,
    max: 200,
    pattern: /%s/,
  })
  titleTemplate = "%s";

  /** URLs per sitemap page; a longer source is split into numbered pages. The protocol's ceiling is 50,000. */
  @Int({
    min: 1,
    max: 50_000,
  })
  sitemapPageSize = 10_000;

  /**
   * `robots.txt` groups by user agent: `*` is every crawler, another key adds that crawler's own group. A rule in
   * one group never applies to another crawler.
   */
  // reason: a map of inline robots groups; the shipped schema checks each user agent and path
  @Field(SeoConfig$.shape.robots)
  robots: Record<string, { allow: string[]; disallow: string[] }> = {
    "*": { allow: ["/"], disallow: [] },
  };

  /** The Open Graph image route: the kinds it answers, the image size and its edge lifetime in seconds. */
  // reason: an inline object an override assigns whole; the shipped schema checks its kinds and pixel bounds
  @Field(SeoConfig$.shape.og)
  og: { kinds: OgKind[]; width: number; height: number; cacheSeconds: number } = {
    kinds: [OgKind.Site, OgKind.Page, OgKind.Product],
    width: 1200,
    height: 630,
    cacheSeconds: 86_400,
  };

  /** Search parameters that turn a page into `noindex`. */
  noindexParams: string[] = [];

  /** Also write the sitemap sources of the consumed manifests (builder pages, storefront products). */
  consumedSitemaps = false;

  /** Emit hreflang alternates in every head. */
  hreflang = true;

  /** Emit JSON-LD, through the escaper, in every head that has structured data. */
  jsonLd = true;
}
