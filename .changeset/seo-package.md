---
"@stackra/seo": minor
---

Add `@stackra/seo`, how a site is found per ADR 0301. `.` ships the `SeoConfig` configuration (`seo`: `titleTemplate`,
`robots`, `sitemapPageSize`, `noindexParams`, `consumedSitemaps`, `og`, `hreflang`, `jsonLd`) with its shipped schema
`SeoConfig$`; the `Changefreq` and `OgKind` enums; the SEO chain `resolveSeo` over `Seo` links (app defaults, static
`seo`, `meta()`, tenant record) with derived canonical, alternates, site name and image; `alternates` and `localePath`
as ordinary functions client code can call; the JSON-LD escaper `serializeJsonLd`; `canonicalRedirect` (301 on the URL
alone); `robotsTxt` with one group per crawler; and paged sitemaps (`sitemapFiles`, `sitemapPage`, `writeSitemap`,
`writeSitemapIndex`, `SitemapSource`) within 50,000 URLs and 50 MB per file. `./contracts` ships the `OgRenderer` port
and the `OgCard` type, `./server` the Node renderer `renderOgImage`, and `./worker` the Worker driver
`SatoriOgRendererDriver`. The old `./og`, `./robots` and `./sitemap` entries are folded in.
