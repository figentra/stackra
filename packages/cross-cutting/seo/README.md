# @stackra/seo

How a Stackra site is found (ADR 0301): one SEO chain per route, hreflang alternates and locale paths that client code
can call, structured data that cannot break a page, canonical redirects that depend on the URL alone, robots rules per
crawler, sitemaps paged within the protocol limits, and the Open Graph image of a site, a page or a product.

**Tier:** `tier:lib` (`packages/cross-cutting/seo`). Entries `.`, `./contracts`, `./server` and `./worker` (the old
`./og`, `./robots` and `./sitemap` entries are folded in). Depends on `@stackra/config`, `@stackra/container`,
`@stackra/contracts`, `@stackra/i18n`, `@stackra/validation`, zod, satori and `@resvg/resvg-wasm`.

## What is here

| Entry         | Symbol                                 | Use                                                                                      |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `.`           | `SeoConfig`                            | the configuration (key `seo`): title template, robots groups, sitemap paging, OG route   |
| `.`           | `SeoConfig$`                           | the shipped schema a member's generated override extends                                 |
| `.`           | `Changefreq`                           | a sitemap source's change frequency (`always` … `never`)                                 |
| `.`           | `OgKind`                               | the Open Graph image kinds: `site`, `page`, `product`                                    |
| `.`           | `Seo` (type)                           | one link of the SEO chain, what a route's `meta()` returns                               |
| `.`           | `resolveSeo`                           | runs the chain: defaults, static `seo`, `meta()`, tenant record, then the derived fields |
| `.`           | `alternates`, `localePath`             | hreflang URLs of a page and a path in one locale's mount; ordinary functions             |
| `.`           | `serializeJsonLd`                      | the escaper: a JSON-LD block as safe `<script type="application/ld+json">` text          |
| `.`           | `canonicalRedirect`                    | the 301 to the canonical URL, or `null`                                                  |
| `.`           | `robotsTxt`                            | `robots.txt` from crawler groups and sitemap links                                       |
| `.`           | `sitemapFiles`, `sitemapPage`          | walk sources' cursors into numbered files of at most 50,000 URLs                         |
| `.`           | `writeSitemap`, `writeSitemapIndex`    | the XML of a sitemap file and of the index                                               |
| `.`           | `SitemapSource` (type) and its friends | what gen writes into `#stackra/sitemap`                                                  |
| `./contracts` | `OgRenderer`, `OgCard` (type)          | the port that turns a card into PNG bytes                                                |
| `./server`    | `renderOgImage`                        | the PNG of a card on a Node server                                                       |
| `./worker`    | `SatoriOgRendererDriver`               | the `OgRenderer` driver of a Cloudflare Worker (`satori`)                                |

## The SEO chain

Every head is built in one order: the app's defaults (`SeoConfig`), the route's static `seo`, the route's `meta()`, then
the tenant's SEO record. A later link replaces an earlier one field by field; a route passes only what differs. The
canonical URL, the alternates, the site name and the Open Graph image are derived. A preview host or a sandbox tenant is
`noindex` whatever a link says. JSON-LD comes out of `resolveSeo` already escaped.

```ts
override meta({ data: { product }, site }: MetaContext<this>): Seo {
  return {
    title: product.seo.title ?? product.title,
    image: `${site.origin}/og/${OgKind.Product}/${product.slug}`,
    type: "product",
    jsonLd: [{ "@type": "Product", name: product.title }],
  };
}
```

## Configuration

```ts
import { OgKind, SeoConfig as BaseSeoConfig } from "@stackra/seo";

export class SeoConfig extends BaseSeoConfig {
  override titleTemplate = "%s · {siteName}";
  override robots: BaseSeoConfig["robots"] = { "*": { allow: ["/"], disallow: ["/store?q="] } };
  override sitemapPageSize = 5_000;
}
```

## Sitemaps

A source answers one cursor page (or everything, when its query has no cursor); `sitemapFiles` counts each source and
`sitemapPage` gathers one file's window, so no file passes 50,000 URLs or 50 MB. Page 1 of an empty source is a valid
empty sitemap; a page past the end is `null` (answer 404).

## Open Graph images

`renderOgImage` (Node) and `SatoriOgRendererDriver` (Workers, through the `OgRenderer` port) render the same card:
the site's accent colours, the logo mark, the site name, the title and, on a product card, the product's picture. The
faces are Inter and Noto Sans Arabic, fetched once per isolate. A Worker cannot compile WebAssembly from bytes, so it
uses the driver; `renderOgImage` reads the WebAssembly file and runs on Node only.
