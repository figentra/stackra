/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/seo, which has several public files, until `stackra gen` writes
 *          the entry barrels (STA-339). The old `./robots` and `./sitemap` entries are folded in (owner Q4).
 * Boundary: names each re-export and declares nothing. `SeoConfig` lives in the `src/config/` entry folder;
 *           `SeoOptions`, the XML escaper, the sitemap walk and the Open Graph card internals stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { SeoConfig } from "#config/seo.config";
export { SeoConfig$ } from "#core/constants/seo-config-schema.constant";
export { Changefreq } from "#core/enums/changefreq.enum";
export { OgKind } from "#core/enums/og-kind.enum";
export { alternates } from "#core/functions/alternates.function";
export { canonicalRedirect } from "#core/functions/canonical-redirect.function";
export { localePath } from "#core/functions/locale-path.function";
export { resolveSeo } from "#core/functions/resolve-seo.function";
export { robotsTxt } from "#core/functions/robots-txt.function";
export { serializeJsonLd } from "#core/functions/serialize-json-ld.function";
export { sitemapFiles } from "#core/functions/sitemap-files.function";
export { sitemapPage } from "#core/functions/sitemap-page.function";
export { writeSitemap } from "#core/functions/write-sitemap.function";
export { writeSitemapIndex } from "#core/functions/write-sitemap-index.function";
export type { AlternatesContext } from "#core/types/alternates-context.type";
export type { JsonLd } from "#core/types/json-ld.type";
export type { ResolvedSeo } from "#core/types/resolved-seo.type";
export type { RobotsGroup } from "#core/types/robots-group.type";
export type { Seo } from "#core/types/seo.type";
export type { SitemapContext } from "#core/types/sitemap-context.type";
export type { SitemapEntry } from "#core/types/sitemap-entry.type";
export type { SitemapFile } from "#core/types/sitemap-file.type";
export type { SitemapHref } from "#core/types/sitemap-href.type";
export type { SitemapItem } from "#core/types/sitemap-item.type";
export type { SitemapSite } from "#core/types/sitemap-site.type";
export type { SitemapSource } from "#core/types/sitemap-source.type";
